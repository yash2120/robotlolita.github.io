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




---

<h4 class="normalcase borderless">Footnotes</h4>

[^1]: **Computational Effects** are all of the observable (to someone) things that your program can do. For example, writing and reading files, displaying things on the screen, sending HTTP requests. If you want to learn about it in more details, [I've written a Quora answer on computational effects](https://www.quora.com/In-pure-Functional-Programming-languages-are-functions-allowed-to-call-other-functions-If-so-then-if-the-function-that-is-called-is-removed-from-the-code-source-wouldnt-that-be-considered-a-side-effect/answer/Quildreen-Motta).

[^2]: We all know that [Haskell is useless](https://www.youtube.com/watch?v=iSmkqocn0oQ). :P
