---
layout: post
title: "A Monad in Practicality: First-Class Failures"
snip:  How monads help you to deal with failures in a sane way
published: false
---

There are [plenty of tutorials][] [on what][] [monads are][] out there, some
times using fairly "interesting" (i.e.: weird) analogies. This is not one of
them. Instead, here I'll provide a walk through some practical use cases for
specific monadic structures in the JavaScript land.

This article shows how the `Maybe` monad can be used for handling simple
failure use cases, without the drawbacks associated with using a value like
`null` (e.g.: `NullPointerException`s). It then extrapolates slightly from the
simple case into complex failure scenarios where you want to track the reasons
of the failures, and shows how these cases can be modelled in terms of the
`Either` monad to achieve the same goals of the core exception handling
functionality, but without the problems (e.g.: lack of compositionality,
non-locality) associated with the `try ... catch` mechanism. Finally, it
concludes with a variation of the `Either` monad called `Validation`, which can
be used for aggregating failures in scenarios like schema validation, and how
to write and compose abstract operations that can manipulate any monadic
computation.


[plenty of tutorials]: http://www.haskell.org/haskellwiki/Monad_tutorials_timeline
[on what]: http://learnyouahaskell.com/a-fistful-of-monads
[monads are]: http://channel9.msdn.com/Shows/Going+Deep/Brian-Beckman-Dont-fear-the-Monads


## Table of Contents

 1. [Introduction](#1_introduction)
 2. [Modelling Errors](#2_modelling_errors)
    1. [Maybe Things Don't Work](#21_maybe_things_dont_work)
    2. [Interlude: chain](#22_interlude_chain)
    3. [You Either Succeed, or You Fail](#23_you_either_succeed_or_you_fail)
    4. [Sometimes You Fail More Than Once](#24_sometimes_you_fail_more_than_once)
 3. [Composing Computations](#3_composing_computations)
 4. [Abstracting Computations](#4_abstracting_computations)
 5. [Conclusion](#5_conclusion)
 6. [References and Additional Reading](#6_references_and_additional_reading)


## 1. Introduction

Failures are difficult, yet our applications tend to fail more than we would
want them to. More so, failures in the presence of side-effects are specially
dangerous, because we need to somehow revert the changes we've applied, but
before we do that we need to **know how much of the changes got applied, and
what the correct state should be**. The usual solution for impure failures is
to use exceptions, JavaScript handles this through the `try ... catch`
statement and `Error` objects, which is similar to what other mainstream
programming languages, like Java, Python, and Ruby use.

The common usage of these mechanisms in mainstream programming, however, have a
handful of problems:


#### Non locality

When you throw an exception, you leave the local stack and environment, and
ends up God-knows-where. Maybe the recovering site will be able to handle the
failure, maybe it won't. In the latter case, your program will be running in an
inconsistent state and as long as it continues to do so, bad things can happen.

Consider the case where you fail to handle a failure to connect with the
database due to a temporary network unavailability, but the recover site
happens to swallow the error/or is not able to react in a sensible manner. Your
application goes up, and all data every user tries to save in your website is
silently moved over to `/dev/null`.
    
    
#### Lack of compositionality

We want to compose computations to cut down the complexity of the application,
but exceptions limit the amount of compositionality we can achieve. This
happens because throwing and recovering from exceptions is a second-class — and
side-effecty — construct, thus we need to write call-site specific code to
compose computations that use such mechanisms.


#### Impaired reasoning

With side-effects, non-local exceptions and recovering, our code ends up with a
confusing flow which is difficult to reason about, since now a small piece of
code may affect several places, depending on how the exceptions are handled up
the call stack.


#### Ad-hoc pattern matching galore

Due to the issue of non-locality, to properly control and recover from
side-effectful exceptions, one needs to model all possible kinds of failure as
specific sub-classes of the `Error` object, then re-throw all of the exceptions
that don't match a specific subclass in the recovering site. In JavaScript,
there are two main problems with this approach: first one, most people don't
ever use specific subclasses of `Error`, thus you would have to **PATTERN MATCH
WITH REGULAR EXPRESSIONS ON NATURAL LANGUAGE, INITIALLY WRITTEN FOR THE (HUMAN)
DEVELOPER** in order to achieve this; and it leads to an unnecessary amount of
code-bloat for deriving these classes.
    

#### What about monads, then?
    
Monads solve all of these problems, so they are a good fit for modelling
failures that **can be recovered from**, in some way, programmatically. There's
no way to recover from a dead HDD, for example, thus your program should just
fail as fast as possible in these cases.

This article describes how the [Maybe][], [Either][] and [Validation][] monads
provide the necessary framework for modelling these kinds of computations and,
more importantly, composing and abstracting over them, without impairing
reasoning about the code. To do so, we use objects that follow the laws of
algebraic structures defined in the [Fantasy Land][] specification for
JavaScript.

But what's a monad? A monad is a wrapper for some computational context, which
satisfies certain algebraic laws, and provides you a single operation to create
a new monad by transforming the computational context from another monad. But
don't worry if you don't get this now, monads are intentionally abstract — so
we can generalise everything! Which is why we'll instead look at specific types
of monads in this article.


[Maybe]: https://github.com/folktale/monads.maybe
[Either]: https://github.com/folktale/monads.either
[Validation]: https://github.com/folktale/monads.validation
[Fantasy Land]: https://github.com/fantasyland/fantasy-land

## 2. Modelling Errors

Some computations might not be able to give you a response, but in most
programming languages we still regard them as a computation where you provide
some values, and get a new value back. But what happens when the computation
can't provide the value? You don't know, unless you read the documentation or
source code for that particular functionality.

Some monads allow one to make this kind of effect (*potential failure*)
explicit, thus you're always forced to acknowledge that things might go wrong
when using the function. While this might sound like too much work at first, we
should initially consider that by just making the effects of a computation
explicit we gain astounding clarity about the code we're reading — suddenly,
the contracts of what a function may do are expressed in the code, rather than
on the documentation. The code can't get out of sync with itself!

None the less, since monads are a kind of structure that follows a standard
representation and laws, we can easily write functions to abstract over any
kind of monad — just as you could write a generic function that works in any
kind of collection. This allows one to abstract over computations, avoiding the
issue of repeating yourself over and over and over again.


### 2.1. Maybe Things Don't Work

The simplest case of potential failure is a computation that may say: “Yes, I
have a result and this is the result,” or “I am sorry, but I don't have a
result.” This effect is usually handled implicitly in major programming
languages by returning something like `Null`. Of course
[this comes with its own well-known problems](http://www.infoq.com/presentations/Null-References-The-Billion-Dollar-Mistake-Tony-Hoare),
but we can easily capture the effect using the [Maybe][] monad, without the
problems associated with null references!

Let's consider a simple case: I want to extract the first item of a
sequence. The problem is that sequence might not have any items, in which case
it would not make sense for the operation to return any value. In JavaScript,
if you use `sequence[0]` you're always going to get `undefined` if the item
doesn't exist.

Furthermore, I want to combine the results of this applying operation to two
different sequences, and some of these sequences might have no elements. A
naive approach would be to just extract the first element and use the
concatenation operator:

{% highlight js %}
// Array(a) -> a | undefined
function first(sequence) {
  return sequence[0]
}

var consonants = 'bcd'
var vowels     = 'aei'
var nothing    = []

var firstConsonant = first(consonants)
var firstVowel     = first(vowels)
var firstNothing   = first(nothing)

var combination1 = firstVowel + firstConsonant // 'ab', yey!
var combination2 = firstVowel + firstNothing   // 'aundefined', eugh!
{% endhighlight %}

Okay, so the naive approach does not work, because the sequence may have no
items. One needs to check if they've got an answer before concatenating things
(let's disregard the fact that concatenating a string with something
non-existent should have been a type error for now):

{% highlight js %}
if (firstVowel !== undefined && firstConsonant !== undefined) {
  combination1 = firstVowel + firstConsonant // 'ab', yey!
} else {
  combination1 = undefined
}

if (firstVowel !== undefined && firstNothing !== undefined) {
  combination2 = firstVowel + firstNothing // never happens
} else {
  combination2 = undefined
}
{% endhighlight %}

Okay, so now we have our code working greatly, but just look at how many checks
we had to do just in order to combine two things! Let's try modelling our
operation in terms of the `Maybe` monad and see if we can get rid of all this
cruft. A `Maybe` monad has two cases: `Just(a)` is a monad with the value `a`,
and `Nothing` is a monad with no computational context — the `null` case.

{% highlight js %}
// Array(a) -> Maybe(a)
function first(sequence) {
  return sequence.length > 0?  Maybe.Just(sequence[0])
  :      /* otherwise */       Maybe.Nothing()
}
{% endhighlight %}



Now, for any sequence that we feed into the `first` function, we may either get
an answer, or we may get no answer, and this is reflected on what we return
from the function. We've made the effects (the potential failure) of this
function explicit, but in doing so we've increased the amount of code we had to
write slightly. Sadly, not only this, but our original code for combining
things don't work anymore!

{% highlight js %}
var consonants = 'bcd'
var vowels     = 'aei'
var nothing    = []

var firstConsonant = first(consonants)
var firstVowel     = first(vowels)
var firstNothing   = first(nothing)

var firstVowel + firstNothing   // doesn't make sense
var firstVowel + firstConsonant // doesn't give you 'ab'
{% endhighlight %}

We can't really combine an answer with something that has no answer. It doesn't
make any sense. Likewise, we can't straightforwardly combine `firstNumber` and
`firstLetter`, because the addition operator doesn't know how to handle a
`Maybe` monad. Not being able to combine straight-forwardly an answer with
something that doesn't exist is a good idea, but we would of course like to
have an operator that can work with the values of a maybe. 

We can't take the value out of the monad, however, so how do we combine things
if we can't extract their values? Well, every monad provides the `chain`
operation, which allows a function to transform the value from one monad, and
put the transformed value into another monad. If this sounds confusing, imagine
that in this case we've got a cat into a box. We have no way of extracting the
cat from the box, but we have a machine that will allow we to add a small top
hat to the cat, and provide a new box of the same shape (lest the poor soul
suffers) for it. This is basically the intuition for the following piece of
code:


{% highlight js %}
// Monad(a), Monad(a) -> Monad(a)
function concatenate(monadA, monadB) {
  // We take the value of the `monadA`
  return monadA.chain(function(valueA) {
    // And the value of the `monadB`
    return monadB.chain(function(valueB) {
      // And place the concatenated value in a new monad
      // of the same type as the `monadB`
      //
      // The `of` operator allows us to put things inside
      // a monad.
      return monadB.of(valueA + valueB)
    })
  })
}
{% endhighlight %}

And finally, we can use the `concatenate` operation instead of the `+`
operator:

{% highlight js %}
combination1 = concatenate(firstVowel, firstNothing)   // stays Nothing
combination2 = concatenate(firstVowel, firstConsonant) // Just('ab')
{% endhighlight %}

Great, our code is terse again, and we didn't even have to do anything to
propagate the failures when it doesn't make sense to combine two things! Sounds
like the right path to be on.


### 2.2. Interlude: `chain`-ing monads

You might have realised that I used two methods on the monad objects in the
previous section, which I have hardly explained: `chain` and `of`. These are
the two operations that all monads must implement to be considered a
monad. More so, these operations need to follow a few algebraic laws to ensure
that all monads can be composed without any edge case, or inconsistent
behaviour.

Before I talk about the [Either][] monad, it helps to keep in mind that monads
are things that contain computational context (values, in most cases), and have
one operation to manipulate some values of the monad (`chain`), and an
operation to put values into a monad (`of`). These are the only two (low level)
ways we can interact with the values, and what they do is highly dependent on
the specific monad type. We can *never* interact with the values in a monad
directly, because that would break the laws (and as you probably know if you're
of legal age in your country, breaking the laws tends to end up badly), however
we can easily write any sort of high-level construct to manipulate the values
just using these two functions.

Consider, for example, our concatenate operation. We've used `chain` twice, and
in the second case, we used the `of` method to return a monad of the same type
to the `chain` operation, since `chain` always expects you to return a
monad. None the less, the second usage of `chain` is painfully similar with one
operation you might be well familiar with: `Array.map`. Think about it, we're
just transforming the value by a function that returns a new value and placing
it back in the monad! Let's get a bit more abstract, then:


{% highlight js %}
// Monad(a), (a -> b) -> Monad(b)
function map(monad, transformation) {
  return monad.chain(function(value) {
    return monad.of(transformation(value))
  })
}

// Monad(a), Monad(a) -> Monad(a)
function concatenate(monadA, monadB) {
  return monadA.chain(function(valueA) {
    return map(monadB, function(valueB) {
      return valueA + valueB
    })
  })
}
{% endhighlight %}

Great, we got rid of one `monadB.of` call! But we could even abstract it
further by realising that we just want a monad with the value computed from the
value of two monads,
[a fairly common operation](https://github.com/fantasyland/fantasy-sorcery/blob/master/index.js#L47-L54)
that's called `lift2M` — The `M` stands for Monad, of course:

{% highlight js %}
// Monad(a), Monad(b), (a, b -> Monad(c)) -> Monad(c)
function lift2M(monadA, monadB, transformation) {
  return monadA.chain(function(valueA) {
    return map(monadB, function(valueB) {
      return transformation(valueA, valueB)
    })
  })
}

// Monad(a), Monad(a) -> Monad(a)
function concatenate(monadA, monadB) {
  return lift2M(monadA, monadB, function(valueA, valueB) {
    return valueA + valueB
  })
}
{% endhighlight %}



### 2.3. You Either Succeed, or You Fail

While the `Maybe` monad is awesome for the simple cases, like “we want to
find an item in a list, but it might not be there,” “we want to get the value
associated with a key, but the key might not be there,” “we want to read a
file, but the file might not be there.” It doesn't really get us much farther
than the “it might not be there” kind of failure.

Sometimes our failures might be a little more complex, they might require a
little bit more of information to the developer, they might even encompass
several different types of failures! We just can't model these kinds of
computations with the `Maybe` monad because the failure case doesn't accept any
additional information.

We clearly need a new monad for this: meet `Either`, the monad that can model a
success and its associated value, or a failure and its associated value! And
the best of all, since `Either` is a monad, we can seamlessly compose values
using `Either` with the functions we've defined before for the `Maybe` monad.

To see how the `Either` monad can be useful, let's consider the following
scenario: I want to divide some integer by another integer, but one of them
might be 0, and that would have been an error.

{% highlight js %}
var Fail  = Either.Left
var Right = Either.Right

// Int, Int -> Either(fError, Int)
function divide(a, b) {
  return b === 0?         Fail(new Error('Division by 0.'))
  :      /* otherwise */  Right(a / b)
}
{% endhighlight %}

Now we can use that function to safely divide numbers by other numbers:

{% highlight js %}
divide(4, 2)  // Right(2)
divide(5, 0)  // Left(Error('Division by 0.'))
{% endhighlight %}

And abusing the fact that the `+` operator in JavaScript can be used for either
concatenating Strings or arithmetic addition, we've already got a function to
sum 2 numbers in a monad:

{% highlight %}
var add = concatenate // A little abuse of JavaScript's operator semantics :P

add(divide(4, 2), divide(9, 3)) // Right(5)
add(divide(3, 1), divide(4, 0)) // Left(Error('Division by 0.'))
{% endhighlight %}

Again, we didn't have to do anything — no `try/catch`, no guards — and our
failures got propagated automatically. And what's better, because monads share
a common interface, we can apply the functions we've defined for one monad to
any type of monad whatsoever. Monads (and their friends) are the ultimate DRY
tool!

Suppose now that we wanted to sum the result of dividing the elements of one
list, by the elements of another list, granted both lists have the same number
of elements. If we fail to achieve any of these things, we should provide a
friendly error message to the user.

We can start by first defining a `zip` operation that takes two lists, and
gives a list of pairs, where each index corresponds to the a pair of the
elements of one list and the other, which is fairly straight-forward to define:

{% highlight js %}
// [a], [b] -> Either(Error, [(a, b)])
function zip(as, bs) {
  return as.length !== bs.length?
           Fail(new Error('Can\'t zip lists of different lengths.'))

  :      /* otherwise */
           Right(as.reduce(function(a, i) {
                             return [a, bs[i]]
                           }, []))
}
{% endhighlight %}

Now we can define an operation that takes a list of pairs, and returns a list
of the result of dividing the first item in the pair by the second, which is
also fairly straight-forward:

{% highlight js %}
// [(Int, Int)] -> [Either(Error, Int)]
function dividePairs(nss) {
  return nss.map(function(a, b) {
    return divide(a, b)
  })
}
{% endhighlight %}

And finally the sum of these numbers, which just folds over the list to perform
the addition. Since all of the numbers are wrapped in an `Either` monad, we do
need to use `chain` to perform operations on these numbers, and put them back
in the monad, however:

{% highlight js %}
// [Either(Error, Int)] -> Either(Error, Int)
function sum(ns) {
  // We need to start from a Monad, but we can reuse our
  // previously defined `add` computation to work on
  // these new monads too!
  return ns.reduce(add, Right(0))
}
{% endhighlight %}

And putting it all together:

{% highlight js %}
var fives = [5, 10, 15, 20]
var odds  = [1, 3, 6, 9]
var alien = [3, 1, 0, 10, 2, 1]


map(zip(fives, odds), dividePairs).chain(sum)
// => Right(13.05...)
map(zip(fives, alien), dividePairs).chain(sum)
// => Left(Error('Can\'t zip lists of different lengths.'))
map(zip(fives, alien.slice(0, 4)), dividePairs).chain(sum)
// => Left(Error('Division by 0.')
{% endhighlight %}


### 2.4. Interlude: Recovering From Failures

The attentive reader would have noted that no errors were handled in the
previous section, even though the scenario required us to display an error
message to the user. There's a reason this: as you might have noticed, the
type for the `Monad` defines that they contain a thing of type `a`, and they
pass this thing of type `a` over to the continuation fed to the `chain`
method. The problem with the `Either` monad is that it has an `a` and a `b`!

We could solve this problem in two ways: both values could be projected into
the `chain` method, wrapped in a tuple (a static list containing two elements —
similar to what `dividePairs` works with), and the function would have to deal
with both values. This would disallow us from using the `concatenate` function
we defined for the `Maybe` monad, however, since that function expects to
combine two things `a`, not a tuple of `a` and `b`.

Then there's the approach that people usually use when implementing the
`Either` monad: project only the successful values. This bias does pose a
problem in our case because there are no rules for how to work with the value
we did not project in the monad, so if we want to recover from failures we'll
need new operations that are not standardised for a monad.

> My
> [Either](https://github.com/folktale/monads.either/blob/master/src/index.ls#L177-L212)
> monad implementation, which is heavily based on
> [Scalaz's Disjunction](https://github.com/scalaz/scalaz/blob/scalaz-seven/core/src/main/scala/scalaz/Either.scala#L194-L198)
> provides an `orElse` function, which works similarly to the `chain` method,
> but projects the value of the failure, and keeps the successful
> values. [Fantasy Land's Either](https://github.com/fantasyland/fantasy-eithers/blob/master/either.js#L15-L34)
> expects you to either use a [catamorphism][] or swap the values and project
> with the `chain` method. Haskell expects you to pattern match on the
> algebraic data types if you want to handle the failures. And so on, and so
> forth. You should assume that anything that isn't on the Fantasy Land
> specification refers to my monad implementations in this article.

[catamorphism]: http://en.wikipedia.org/wiki/Catamorphism

A way to display the errors to the user would then involve using one of the
library-defined methods to deal with the other failure case:

{% highlight js %}
map(zip(fives, alien), dividePairs)
  .chain(sum)
  .orElse(function(error) {
    console.log('Error when trying to sum the lists: ' + error.message)
  })
{% endhighlight %}


### 2.5. Sometimes You Fail More Than Once

One of the problems with sequencing actions with the monadic `chain` operation
is that, as we've seen with the `Either` monad, they're a fail-fast path, which
means that the whole sequence of actions is abruptly finished with a failure in
case *any* of the actions fail. Sometimes, however, you don't want to sequence
things in this fashion, but rather aggregate all of the failures and propagate
them. A common use case for this is validating inputs, which is why our next
monad is the `Validation` monad.

A `Validation` monad is almost exactly the same as the `Either` monad, with two
differences: it has a vocabulary aimed towards error handling, with the
`Success` and `Failure` constructors, rather than the generalised disjunction
tags `Left` and `Right` in the `Either` monad; and it can aggregate and
propagate all of the failures through the `Applicative Functor` interface. Now,
Applicative Functors are not something I'll go in much detail in this article,
but for the purposes of this article you can think about them as a list where
every element is a function, with a `map` operation that, instead of mapping a
function over the list, you map the list of functions over an element or list
of elements.





## 3. Composing Computations

## 4. Abstracting Computations

## 5. Conclusion

## 6. References and Additional Reading