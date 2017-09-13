---
layout: post
title:  A Language by Any Other Name...
snip:   I know I keep changing the names of these projects I'm so sorry but hear me out
---

This blog post explains things. Mostly about names. Then there's something about languages.

Names are difficult.

Anyway.


## Mid 2013: How It All Started...

Around May of 2013 there was this website called PLT Games. It provided a "challenge" in
computing to be solved with programming language design. At the time the theme was roughly
"design a 'better PHP'". My innocent old self thought "Hey, this is simple enough, maybe
I'll just spend this month working on a language for this."

That was how `Phemme` came about. This was the README from the time:

```md
# Phemme 
 
Phemme is a small, portable functional language for easily writing highly 
concurrent web-servers. It poses itself as a 
["better PHP"](http://www.pltgames.com/competition/2013/5), but it actually 
runs on top of Node, and as such can use anything Node gives you! 
 
 
## Example 
 
A simple "Hello, World!" in Phemme: 
 
    page / {request} => text "Hello, world!". 
 
 
## Installing 
 
Grab it from NPM: 
 
    $ npm install -g phemme 
     
 
## Licence 
 
MIT/X11. Which means you just do whatever the fuck you want to. 
```

The design was actually pretty simple. It was a tiny functional language with two main additions:

 -  There was a facility to declare routes. Routes were basically functions that ran when a
    particular endpoint matched the HTTP request's path, took a Request map, and returned a
    response.

 -  There was a sub-language for first-class HTML objects, kind of like a simpler version of
    React's JSX. Everything was dynamically typed so checks were all done at runtime.

 -  All values were wrapped in promises to enable direct style (lifts were done automatically).

By the end of May I had... not much, really. Just a 
[very informal and incomplete spec](https://github.com/purr-platform/purr/blob/29cfd7a6bac746c53c591eddaf81e2ef8bc7099d/docs/specs.md) 
along with some examples. Things had already changed a lot since the first draft.

It's interesting that even though the initial syntax was Haskell-like, the final one ended up being
based on Smalltalk. There were no objects. I was thinking a lot about Smalltalk-like syntaxes at
the time, and even now I consider Smalltalk syntax really flexible.


## Late 2013: Purr

I kept thinking about Phemme through the year, of course. There were a lot of things in the original
design that bothered me. Sure writing web applications had a lot of issues in a lot of languages.
Most languages weren't *designed* for it, they didn't offer a good workflow for it, etc.

Solving the "writing web applications" problem with languages turned to be a lot harder. Of course
it would be. Yes, yes, I know I could've just written a framework on top of Haskell. But anyway.

At some point I've considered adding types (even refinement types). And objects. And *everything*.

Okay, not really everything. But it sure felt like that. Most of it turned out to be a bad idea.
Traits, objects, and higher-kinded polymorphism on top of that? BAD IDEA. DSLs that are chosen by
the expression's type? Not so much of a bad idea 
(hey, [Wyvern](http://www.cs.cmu.edu/~aldrich/wyvern/) did that, and it was pretty cool)
but more of a "how do I even make sure these different grammars *compose* in the first place?".
Wyvern's "everything has to be indentation-based" wasn't very compelling to me.

So, by the end of the year I had nothing that had advanced the thing I wanted to design, but had
certainly found a lot of ideas that didn't work. Can't say it was the most pleasant feelings but
I want to think it was *progress*.

And then I wrote [Purr](https://github.com/robotlolita/old-purr) (but not [*THIS* Purr](https://github.com/purr-platform/purr)).

Purr was a very simple concept: can we design a language that is object oriented, but still pure
in the Haskell sense (i.e.: referentially transparent, no side effects, etc)? Well, of course you
can. You can even throw monads at your I/Os if you really hate your users.
How would it look like though? Would it be usable? What problems would it solve?

Frankly, I didn't really have any of those major goals designing and implementing Purr. It was just
a fun exercise, like [implementing Shutt's Kernel](https://github.com/robotlolita/liz) was. Even
though I just kinda threw together a parser and compiler in OMeta in a few days.

This exercise did get me more interested in live programming, though. At the time I was also very
interested in how people learn programming, and the ways in which our tools help (or don't) them
achieve that goal.


## Early 2014: Mermaid

Okay, by now you probably think I'm really bad at naming things. I heartfully agree, and that's why
this time I asked for help:

![](/files/2017/talita.png)
<em>
  <strong>Me:</strong> Hey, gimme the name of some random cute thing<br>
  <strong>Friend:</strong> what kind of thing?<br>
  <strong>Me:</strong> anything.<br>
  <strong>Friend:</strong> Cyndaquil.<br>
  <strong>Me:</strong> I don't think I can use that one (and anyway, Charmander > Cyndaquil)<br>
  <strong>Friend:</strong> u.u Mermaid
</em>

If you're not going about asking your friends very random things what are you even doing?

Moving on. So, I kept thinking about live programming environments and teaching, and thought "hey,
these two things should actually be put together". Additionally I thought that putting things inside
a browser would make it easier to adopt, so of course this new language would have to run inside a
browser. Of. Course.

The [initial design](https://github.com/siren-lang/siren/blob/a7a59aa282b99b55bf83811ecc8a25150aaf8410/documentation/language-specification.md)
for Mermaid was pretty reasonable. Take JavaScript semantics, get rid of most things but keep prototypes
and closures, wrap it on some Smalltalk syntax (because of course there would be Smalltalk syntax), and
top it off with a weird mix of Haskell.

Some of this initial design was influenced by the Purr experiment, which was in turn very influenced by
Newspeak. There was no global namespace, and everything was a [generative parametric module taking the
World/Platform as argument](https://gbracha.blogspot.com.br/2009/07/ban-on-imports-continued.html). The
forced purity was dropped, mostly because I found no real good way of doing that. Monads for I/O seemed
like a bad choice at the time, and I still consider them a really bad choice now. Thus Siren went Clojure's
route, and just marked side-effecting functions with a naming convention.

Mermaid wasn't implemented that year, but working on this design idea made me look for previous solutions
to the thing I'm still trying to figure out: how do you make programs *modularly extensible* without eventual
conflicts of any kind requiring *source changes*. [It's a pretty hard problem](https://github.com/siren-lang/siren/blob/master/documentation/notes/object-model.md), to which many people
have proposed different things. I'm not really satisfied with any of them.


## Mid 2014: Purr, But Not *THAT* Purr

Since I didn't have many answers for the things I wanted to do in Mermaid, I just picked up papers to read
and set the idea aside for a bit. In the mean time I went back to work on Phemme. Hey, I do care about
solving the problem of writing web applications, y'know. And this time I had ~*ideas*~.

I quite disliked the name `Phemme`, though. Why not get something cuter. Like cats. Oh, but people had
already [got the cool names](http://kittenlang.org/). They didn't thought about getting Purr though,
so [I got that one!](https://github.com/purr-platform/purr/tree/0d755e38d74b3f57fdb2e15eb0a1e431be6ecf96)

By the time I renamed things, Phemme-now-Purr had a fully working (prototype) compiler, protocols for
polymorphic operations, a prelude mostly based on abstract algebra, a roughly-working web server library,
and I/O based on a Task monad and [Kmett's Machines](https://hackage.haskell.org/package/machines) -- though
more influenced by Rúnar's Scala implementation than Kmett's Haskell one.

I'd spend the following months working on Purr, and trying to figure out how to make writing web applications
easier and safer. A lot of the ideas came from Racket, Haskell, Newspeak, and Clojure -- and these languages
are still some of the major influences on the things I do. 

Purr was also very influenced by the ideas in Mermaid. The major ideas that stuck here were basically:

 -  Metadata for every definition, in order to support exploration in the REPL (Clojure).

 -  Capability-security through parameterised modules with support for mutual recursion (Newspeak).

 -  Language-support for higher-order contracts and property-based/example-based tests attached to the
    definitions (Racket, Pyret).

But there was also a lot that didn't work in this combination of ideas:

 -  Turns out that if you're going to have mutually recursive modules you have to be able to resolve all
    of your module definitions without needing to *use* them during this phase. Purr had some features
    that were not entirely late-bound (like protocol implementations). Things were really tricky here.
    ECMAScript 2015 modules has many of the same problems, by the way, even though it's a significant
    improvement over CommonJS ones in this area.

 -  Generative parametric modules are great? Sure. But if you have multiple instantiations of that module
    and you rely on knowing internal details of them (e.g.: you have a type system or pattern matching),
    then you're pretty much out of luck. Purr tried to avoid this by lifting definitions out of the
    module, but then capability-security got really awkward -- your types are now compatible where you
    don't *want* them to be. This can be sidestepped with some work from the programmer's side though.

    Applicative parametric modules have their own different set of tradeoffs. There isn't really a
    single answer for this one, so you probably want to read Rossberg et al's [F-ing modules][] and
    spend a good amount of time thinking about what you *want* in your language, and how it'll impact
    your users when modules become more prevalent.

 -  [Global coherence is fundamentally incompatible with modularity](https://github.com/purescript/purescript/issues/1886).
    Pick one or the other and deal with the implications. You basically choose whether you want your
    users to be able to extend/combine things without changing source code OR have programs exhibit
    consistent behaviour for the use of features through all modules. If you have types, this gets
    a lot trickier, too.


## Mid 2015: Mermaid and Extensibility

Since I hit a roadblock with Purr, I figured I'd work on some other ideas while I tried to find
solutions for the problems in Purr.

Remember that Mermaid was pretty much a language based on JavaScript, but simpler/closer to Self,
and aimed at teaching. There was nothing particularly innovative in Mermaid. It was supposed to
be a simple language, based on solutions that already existed, and just helped making teaching
introductory programming courses (for the web) a bit simpler.

But.

Of course there's a "but".

One of the ideas in Mermaid was that mutability in objects makes programs harder to follow, and
therefore those should be controlled in a programming language for teaching introductory courses.
That's all well and fine, just don't have an operation that changes state and you're good to go.
Except I decided at the time that it was important for people to:

 1)  Extend existing objects in the system (which was common in JS codebases);
 2)  Do so *without* affecting consumers of that object. In other words, this extension had to be modular.

At the time, I wasn't aware of anything in this area except for [C#'s Extension Methods](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/extension-methods),
but those were static and Mermaid couldn't really use it. So I came up with a concept of
"Method Boxes". You could extend an object as much as you'd like, but those extensions
would be placed in a Method Box, not in the object itself, a message send would go through
a Method Box in order to resolve which message to call for a particular name, so the extension
only affected people who had access to it, not everywhere in the system.

I was curious whether people had published similar solutions before so I could steal some ideas
from them. Smalltalk had [Classboxes](http://stephane.ducasse.free.fr/TopicsClassbox.html),
that had one of Pharo's authors, [Stéphane Ducasse](https://twitter.com/stephaneducasse), in the group.
I believe [Allen Wirfs-Brock](https://twitter.com/awbjs) proposed something similar where
messages would have unique names, but I can't remember the name of the paper. David Ungar
and Randall B Smith (from Self) published a paper on a language called [Us](https://blog.selflanguage.org/2011/09/08/self-us-and-perspectives-on-objects-2/),
which would use a a concept of "subjective programming", where each object had different
"perspectives", and message resolution depended on which perspective you were considering.
And, of course, Aspect-oriented and Context-oriented programming has a lot in common with this!

Eventually Mermaid deviated from the initial "let's make a simple language for teaching
introductory programming" and became more of a vision of computing (similar to how Self
was about realising an experience of computing). Most of the ideas at the time were
informed by Ungar's work on Us and Korz, and Bracha's work on Newspeak.

 -  Reflection was entirely done through [Mirrors](http://bracha.org/mirrors.pdf);
 -  FFI was based on [Aliens](https://gbracha.blogspot.com.br/2008/12/unidentified-foreign-objects-ufos.html);
 -  Method Boxes evolved into Contexts, combining the ideas of context-based programming found in [Korz](http://dl.acm.org/citation.cfm?id=2661136.2661147) and others. They were still *lexical* contexts, instead
    of dynamic ones (like the ones you see in Korz, AmOS, AmbientTalk, etc), but contexts were first-class
    and you could pass contexts around and merge them;
  

## Late 2015: Mermaid -> Siren





[F-ing modules]: https://people.mpi-sws.org/~rossberg/f-ing/