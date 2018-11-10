---
layout: post
title: "Composable Effects With Yield"
snip: >
  When writing programs, we want things that are practical, correct, and flexible. Can we get all of them in JavaScript? Yes, we can. Let's look at how Yield can help with that.
---

<h2>Table of Contents</h2>

  * TOC
{:toc}

## 1. Introduction

When writing programs we want things that are practical, but also things that are correct. People may lean towards different sides of this—they may favour practicality more than correctness, or they may favour correctness more. But, in all cases, we want both.

Things get particularly troublesome when you add computational effects[^1] to your language. And we want to add it, since we want to write practical programs. We want our programs to do _useful things_. And languages without computational effects are, essentially, useless[^2].

I think we can all agree that a language like Python (or Ruby) is very practical. That is what we want to be. More precisely, _this_ is where we want to be:

```python
import random

print("Guess the number!")
secret_number = random.randint(1, 101)

while True:
  guess = int(input("Please input your guess: "))
  print("You guessed: " + str(guess))

  if guess < secret_number:
    print("Too small!")
  elif guess > secret_number:
    print("Too big!")
  else:
    print("You win!")
    break
```

Ah. Beautiful. \*weeps\*.

Anyway, brace yourselves for this is the last piece of beautiful code that you're going to see in this blog post—we'll be using JavaScript from here on. By the way, as a simple comparison between the two:

```js
console.log("Guess the number!");
const secret_number = randint(1, 101);

function loop() {
  console.log("Please input your guess: ");
  read((error, guess_string) => {
    if (error) {
      console.error(error);
    } else {
      const guess = Number(guess_string);

      if (guess < secret_number) {
        console.log("Too small!");
        loop();
      } else if (guess > secret_number) {
        console.log("Too big!");
        loop();
      } else {
        console.log("You win!");
      }
    }
  });
}

loop();
```

And because JavaScript doesn't include much in the way of random number generation, and Node's core libraries are really low-level, we also have to define the following abstractions:

```js
function randint(start, end) {
  return start + Math.floor(Math.random() * (end - start));
}

class EOFError extends Error {}
const readline = require("readline");
function read(k) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.once("line", line => {
    rl.close();
    k(null, line);
  });
  rl.once("SIGINT", () => {
    rl.close();
    k(new EOFError(`Received SIGINT`));
  });
  rl.prompt();
}
```

And... that's a lot of stuff for a very simple program! Not only that, but understanding and writing this simple program isn't even that easy with all of the explicit continuations. Yes, promises could lessen the pain a bit, but they have their own share of problems—we'll talk about all of this later in this blog post.


## 2. Computational effects

### 2.1. What are Effects?

So, this blog post is about effects—computational effects, more precisely... but what *are* effects? Well, effects are all observable things programs do. This includes—but is not limited to—things like:

- Displaying things on the screen;
- Making HTTP requests;
- Talking to databases;
- Reading and writing files;
- Mutating places in memory;
- (you get the idea)

When we talk about effects, *everything* starts to matter. Sure you can evaluate something like `3 * 2 + 4 * 3`. It doesn't matter if you evaluate `3 * 2` or `4 * 3` first, it'll *always* give you the same result. Executing effects doesn't have this nice properety. If you execute `print "hello"; print "world"` in any way different from printing hello first, then printing world, people will probably hate you.

Because of this (and some other historical accidents), some programming languages go to lengths to separate pure computations (those you can evaluate in **any** order, always yielding the same result); and effectful computations (those where execution requires strict ordering, because this execution order *is* observable). 


### 2.2. Separating expressions and effects

To see this separation in action, let's look at Haskell:

```hs
fullName :: String -> String -> String
fullName first last = first ++ " " ++ last
```

This code defines a function, `fullName`, which takes two strings (the first and last name), and returns a new string, which is the full name of some person. It doesn't matter the order in which you evaluate the `first` or `last` expressions, this code will always give you the same result, for the same inputs.

But what if we wanted the `first` and `last` names to come from some external place? For example, what if we wanted to ask the user to input their first and last names? We've seen how beautiful and practical this was in Python, so clearly a language like Haskell would allow us to do this as well, right? And, sure enough, Haskell has the `getLine` and `putStrLn` functions in the standard library to do just this (unlike JavaScript).

So we quickly write a short function like this (don't mind the thousands of lets--a Haskell function must have exactly one expression in its body):

```hs
getFullName :: String
getFullName =
  let _ = putStrLn "What's your first name? " in
  let first = getLine in
  let _ = putStrLn "What's your last name? " in
  let last = getLine in
  first ++ " " ++ last
```

So you run it through the compiler and...

![The GHC compiler shows you a really long error that tells you that you're wrong](/files/2018/effects-01.png)
{: .centred-image .full-image }

The whole scary wall-of-text (in red, no less) is just telling you that `first` and `last` ought to be a `String` (which in Haskell is also called `[Char]` -- a list of characters), because that's what `++`, the concatenation operator, works on. However, `getLine` returns `IO String`, and those two types are not compatible!

For historical reasons, Haskell separates effectful computations from pure computations. A lot of this "historical reasons" amounts to ["Haskell is a lazy language, so the order in which your program is evaluated is not the order described in the source code"](https://www.quora.com/Why-do-we-need-monad/answer/Quildreen-Motta). Which would not be great for effects—we *care* about their order. Some of it is there just because Haskell is Useless[^2].

We need some way to tell Haskell which order we want effects to execute. To do so, Haskell chooses to place these effects in a type called IO. It then only allows IO types to interact with other IO types. And this interaction is limited to what's described in a type called Monad--this Monad type ensures that the ordering of the effects is preserved. But it comes with a price:

```hs
getFullName :: IO String    -- we must put the strings inside the IO
getFullName =
  putStrLn "What's your first name? " >>= \_ ->
    getLine >>= \first ->
      putStrLn "What's your last name? " >>= \_ ->
        getLine >>= \last ->
          return (first ++ " " ++ last)
```

The `>>=` operator from the Monad type combines the monad from the left with the computation from the right. For IO, this means that we run the effect on the left, and pass its result to the function on the right, which must return a new IO effect. `return` here means "take this thing on the right and wrap it in the monad", which basically puts things inside the IO for us.

The weird indentation here is just to show that with each effect, we need to provide a new function that'll continue with the computation. If you've ever seen callbacks used for programming, here they are in full glory. Anyway, Haskell at least tried to make this less painful with what they've called `do` notation:

```hs
getFullName :: IO String
getFullName = 
  do  -- this starts a `do` notation block
    putStrLn "What's your first name? "
    first <- getLine
    putStrLn "What's your last name? "
    last <- getLine
    return (first ++ " " ++ last)
```

The compiler translates the code above to the one using `>>=` we saw before. Here `name <- effect; ...` runs the (monadic) effect on the right, and binds its result to the variable `name`, it then continues executing the rest of the `...` block. This is very similar to what we're used in imperative languages with statements, but these statements are very limited, and something like `name <- [getLine; getLine]` is not allowed.

But... what does all of this have to do with JavaScript?

Well, remember how we had to do all of those weird tricks to read a line from the standard input in JavaScript? That's because [JavaScript also separates *some computations* from *some effectful computations*][colour]. For JavaScript in particular, the effectful computations that take a long time to run are always separated, and must be dealt with differently—and we call them "asynchronous" to separate them from the beautiful, practical "synchronous" ones.

For a long time, handling asynchronous functions in JS meant just using callbacks everywhere. Like the first JS example in this blog post, and the first working Haskell example here. Current solutions, however, involve using [monads][quil-async-monad], like in Haskell, or using [Promises][quil-promises]—particularly with the new [async/await syntax][async-await].

Monads and Promises are all well and fine until you realise that... they don't *compose*. If you have some monad `A` in your code, then *EVERYTHING* must be a monad `A` as well. Likewise, if you have a promise, **EVERYTHING** must be a promise. This is less problematic in JavaScript than in Haskell—in JavaScript only *some* effects are separated. But it's still not *ideal*.


### 2.3. Effects and Control




---

## References

[Monads for Functional Programming](https://homepages.inf.ed.ac.uk/wadler/papers/marktoberdorf/baastad.pdf)
: *Philip Wadler (1995)*

[What Colour is Your Function][colour]
: *Bob Nystrom (2015)*

[A Monad in Practicality: Controlling Time][quil-async-monad]
: *Quil (2014)*

[How do Promises Work][promises]
: *Quil (2015)*



[colour]: http://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/
[quil-async-monad]: https://robotlolita.me/2014/03/20/a-monad-in-practicality-controlling-time.html
[async-await]: FIXME:


<h4 class="normalcase borderless">Footnotes</h4>

[^1]: **Computational Effects** are all of the observable (to someone) things that your program can do. For example, writing and reading files, displaying things on the screen, sending HTTP requests. If you want to learn about it in more details, [I've written a Quora answer on computational effects](https://www.quora.com/In-pure-Functional-Programming-languages-are-functions-allowed-to-call-other-functions-If-so-then-if-the-function-that-is-called-is-removed-from-the-code-source-wouldnt-that-be-considered-a-side-effect/answer/Quildreen-Motta).

[^2]: We all know that [Haskell is useless](https://www.youtube.com/watch?v=iSmkqocn0oQ). :P
