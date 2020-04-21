---
layout: article
title: Abandoning Type Classes For a Greater Good!
snip: >
  Type Classes offer a very practical form of extensibility, but they come at a hefty price. In this article we explore the security and modularity issues with Type Classes, and look at some alternatives.
categories: [fp, purr]
---

Type Classes are a concept that allows one to define new operations on some type (for example, integers), without having to modify the source definition of that type. In languages like Haskell, Elixir, Clojure, and Rust, they provide a very practical way of extending types. But they come at a price: they are not modular, and they make it harder to reason about the application's security.

In this article we'll explore these two assertions in details, and look into some of the alternatives that I've been working on for the [Purr](https://purr.origamitower.com/) project.

This article assumes that the reader is familiar with some form of modularity and extensions. For example, objects or multi-methods in an object-oriented language; or Type Classes/Protocols in a functional language. For those who are not familiar with Haskell or Type Classes, there'll be interludes introducing the concepts.


<h2>Table of Contents</h2>

  * TOC
{:toc}

## 1. The Problem

Let's imagine that you're writing a wishlist application. All data is going to be stored in memory, and you decide to use a Set data structure to hold the items that the user desires. After all, you only need to know if an item is there, and a set provides a very efficient way of solving exactly that problem.

Fortunately, the language you're writing this application in has a built-in Set structure. Unfortunately, it uses the value's identity (e.g.: the location it occupies in memory) in order to test if it is in the set. Your wishlist shows data coming from different places, and you construct a structure representing that data on demand. This means, for example, that the user could add a Nintendo Switch to their wishlist. Later, when browsing through the data, it would show a Nintendo Switch as not part of their wishlist—it's the same data, but not the same value in memory.

You consider some of your options: you could use a List, but in order to check if an item is in the list you'd need to test every item in there; You could try to come up with a way of deriving an unique integer ID from the data, but you'd need to guarantee that different data always maps to a different ID; Or you could write your own Set implementation, which would fit your context, but then you'd need to maintain it on top of maintaining your application.

None of these options are any good. It puts additional burden on the implementer and makes it less likely that they'll be able to build successful applications—the more code you need to maintain, the higher the costs of maintaining it; it's easy to see that the costs can quickly outweight the benefits if this goes on.

A better situation would be to have the Set data structure be adaptable to its users' context. For example, if the Set structure allowed one to provide a way of testing its elements, the user would be able to provide a hashing function (or a comparison function) when constructing the Set, and would not need to worry about it anywhere else in the code.

How often does one have this problem in practice? It depends on how much the language encourages the use of components written by other people. However, as modern software needs become more complex (users are not willing to accept a command-line application for most things these days), so does the need to offload some of that work to other parties. And as the number of libraries grow, so does the incidence of this problem.


## Interlude A: Type Classes

So we've seen that libraries often need to be adapted to fit an user's application context. One way of designing a library that can be adapted, in a language with first-class functions, is to allow users to provide functions to control parts of the behaviour.

If we consider the set structure previously mentioned, this is how it could look like, in an hypothetical functional language:

```
record Set of A {
  items :: List of A,
  comparator :: fun (A, A) -> 'lt' | 'eq' | 'gt'
}

define set_has(set: Set of A, expected: A) =
  let find = fun
    %% If there're no items left in the set, then it's not there
    ([], comparator) -> false;

    %% If there's at least one item left, compare our expected
    %% value to it. The set is sorted, so we only need to progress
    %% in the list of items as long as we don't find a greater item
    %% than what we're looking for.
    ([item, ...rest], comparator) ->
      match comparator(expected, item)
        case 'lt' ->
          find(rest, comparator);
        case 'eq' ->
          true;
        case 'gt' ->
          false;
      end
  end;
  find(set.items, set.comparator);
end
```

Now let's say we want a set of integers. We would need to construct a new set with an integer comparator function:

```
let IntSet = Set {
  items = [],
  comparator = fun(a, b) -> integer_compare(a, b) end
}

define integer_compare(a: Integer, b: Integer) =
  if a < b then 'lt'
  else if a = b then 'eq'
  else 'gt';
end
```

Had we a need for a set of Strings, we would similarly need to provide a string comparator. A set of Integers and Strings would require yet more work from us, as we'd need to combine those comparators somehow, and then define some form of ordering between values of different types.

As data structures decide to make more parts configurable, this can quickly become unwieldy. The task of manually deriving and combining these functions makes programmers less likely to use a good data structure for the task; they will reuse existing ones, as long as they can get away with it, because there's less effort involved.

Enter Type Classes. This feature is designed to make these sort of adaptations practical. It lets users describe a category of functionality for data structures, and then allow implementations to be provided by third-parties, whereas none of the *consumers* of this category need to care or worry about that.

To make this more concrete, were we to re-implement our set structure above using type classes, we would have the following:

```
typeclass TotalOrder for A =
  operation compare(A, A) -> 'lt' | 'eq' | 'gt'
end

record Set of A -- when A has TotalOrder {
  items: List of A
}

define set_has(set: Set of A, expected: A) =
  let find = fun
    ([]) -> false;
    ([item, ...rest]) ->
      match TotalOrder.compare(expected, item)
        case 'lt' -> find(rest);
        case 'eq' -> true;
        case 'gt' -> false;
      end
  end;
  find(set.items)
end
```

Now, instead of our Set containing a comparator function, it declares that it works for all types, call it A, as long as such type has a TotalOrder. In this case, a TotalOrder is described by the `compare` operation. In an object-oriented language, `TotalOrder` would pretty much be an interface.

Where type classes differ from regular interfaces in Object-Oriented programming, is that they allow us to provide implementations for different types, outside of the definition of the type itself. For example, we can define a TotalOrder for integers even if we don't have access to the Integer source code.

```
implement TotalOrder for Integer =
  define compare(a: Integer, b: Integer) =
    if a < b then 'lt'
    else if a = b then 'eq'
    else 'gt';
  end
end
```

Indeed, this implementation can even be packaged in a library and shared, such that an user that wants integer sets doesn't need to define a total ordering for integer themselves—they just need to download a library that does such.

Regardless of how these definitions enter the system, none of the code that *uses* the Set needs to be aware of it. That sets require (and use) a TotalOrder is an internal detail.

```
let set1 = set_empty as Set of Integer;
let set2 = set_add(set1, 1);
let set3 = set_add(set2, 10);
set_has(set3, 1); %% => true
```

The only thing required of us is to declare that our set will contain Integer values. And as long as a TotalOrder exists for Integer values, everything will work. This makes our use sites very similar to Object-Oriented programs, where these details are often implicit. But still allows us to implement these operations without modifying the source code for any data structure.

