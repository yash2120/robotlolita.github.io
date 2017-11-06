---
layout: post
title:  Programming, Languages, and Computers
snip:   What are programming languages and how do they work?
---

> <strong class="heading">This blog post is beginner friendly</strong>  
> This blog post explores some concepts that are very complex, but it tries to
> do so in a way that's accessible for people who are only beginning in the area
> of programming.
> 
> If you think some part of the blog post is hard to understand, that's something
> I'd like to try fixing. It'd be lovely if you could email me on 
> `queen` at `robotlolita.me`, or [reach to me on Twitter](https://twitter.com/robotlolita)
> to talk about it :)
{: .trivia .note}

<h2>Table of Contents</h2>

  * TOC
{:toc}


## 1. What's "Programming"?

Let's start by clarifying what this blog post will discuss.

When people talk about "programming", many tend to have this image
of something incredibly difficult, that only some selected few would be
able to understand. "You have to remember all of those codes, right?"
they will say. "I don't think I'd like coding."

![](/files/2017/11/pl1.png)
*The stereotypical coder, staring at black screens with incomprehensible codes all day*
{: .centred-image }

But you most likely have been programming without knowing it. Yes, you.
People just don't *call* it programming. They say they're "setting up
a spreadsheet". Or "recording a macro". Or "tweaking my blog". Or
"creating this survey on Google Forms".

> "Programming is a way of teaching the computer how to do something."
{: .highlight-paragraph .pull-in }

That's all programming. We can think of programming as "a way of teaching
the computer how to do something". When you make a spreadsheet to track
the amount of hours you've worked in that art commission, *that's programming*.
You're really teaching the computer how track those hours for you. You could
always just do it all by hand, of course. But that'd take more time, and would
be more error prone.

"I didn't write any code," you protest. Indeed. But programming has never
been about "codes". It's all about communicating with the computer. 
Sure, the usual "code" is one way to do that. But just like English isn't
the only way of communicating with your friends, "code" isn't the only
way of communicating with the computer. In his [The Future of Programming](https://vimeo.com/71278954)
talk, Bret Victor describes many of these different ways of programming.
[Alan Kay gave many similar talks](https://www.youtube.com/watch?v=BbwOPzxuJ0s).


## 2. Programming and Languages

Programming is about communication, and one way of communicating is by
using languages. Indeed, we chat with our friends, read, and watch things in
some language. Most of which are natural languages like English, or Japanese, 
or Libras (Brazilian Sign Language). Sometimes we communicate in constructed
languages. When we discuss set theory, the mathematical notation is a
constructed language.







We can see "programming" as "a way of making the computer do things for you". 
For example, you may want to share your photos on your Instagram and Twitter account.
"Sharing your photos to your followers" is what you want to happen, but this is
hard because your followers are in different networks. Of course, you could just post
your work manually in each of these platforms, but that looks like something your computer
should be doing for you.

![](/files/2017/11/pl-ifttt.png)
*Sending photos to Instagram & Twitter*
{: .pull-right }

A tool like [IFTTT](https://ifttt.com/) may be used to achieve that. In it, one
describes that if something happens, something else should happen in response.
Hence IFTTT ("if [this] then [that]"). In the example on the right, every time 
a new picture is posted on Instagram, the same picture is posted on Twitter.

Now, IFTTT is probably not what most people associate with the word "programming".
First, there's no concept of "code" in it. Instead, one picks from a visual list
of triggers in one service. For Instagram, this could be something like
"whenever I post a photo". Then the person picks from a visual list of reactions
in another service. For Twitter, this could be "Tweet an image".

{: .clear }

Some of these triggers and reactions are configurable. For example, for the
"Tweet an image" reaction the user can choose what the text of the tweet and
provide an URL for the image. This is done by filling out forms like the one
below:

![](/files/2017/11/pl-ifttt2.png)
*Configuring what to post on Twitter*
{: .centred-image }

Teaching the computer how to do something for you is essentially what
programming is about. In the example above it's been done by choosing
items from a list and filling a form. But that's not the only way in 
which programming can happen. Making a spreadsheet to calculate the
hours you spend on something is also programming. After all, the
computer is doing those calculations for you, liberating you from
having to use a calculator, or pen-and-paper.

Sometimes, the way of teaching the computer how to do things for you
takes in a more textual format. [Prompter](https://versu.com/about/how-versu-works/),
for example, is a tool that allows one to teach computers about 
characters in an interactive story, which can then be played as
a simulation game. It looks like this:

> **CAST**
> 
> The Ad Designer (playable) ........................... Alice Lin  
> The Boss ............................................. Dave Johnston  
> Another Emplooyee .................................... Patrick Rutigliano  
> Yet Another Employee ................................. Jordan Fischer  
> The Client ........................................... Chandra Tarhouni-Cook
> 
> (...)
>
> A poor young straight Ancient Roman man. By reputation he is 
> attractive - "[He] is widely accounted tremendously handsome", 
> intelligent - "[He] is known for his poetry, and cannot be supposed a fool",
> but not proper - "[His] misbehaviour, with various ladies, is the talk of the town".
> He is open, unconscientious, extroverted and flirtatious. He is concerned with
> attractiveness, intelligence and frienship.
>
> (from the [Prompter paper](https://versublog.files.wordpress.com/2014/05/graham_versu.pdf))

Which may make you think it would be a script for a play. That is certainly the
idea, given that the target users of this tool are writers. Inform 7, which is 
used similarly for interactive fictions, [has a very similar way of describing concepts to the computer](http://inform7.com/learn/eg/glass/source.html).

And, of course, there is the things people generally associate with the
term "programming". The example below is part of a [text editor for novelists](http://robotlolita.me/raven/),
and deals with listing the user's novels. You don't have to understand it. The specifics of
each of these different forms of programming are not important:

{% highlight js %}
function list() {
  return $do {
    dir <- novelHome;
    folders <- FS.listDirectory(dir);
    dirs <- filterM(Future, isNovelDirectory, folders.map(joinPath(dir)));
    files <- parallel(dirs.map(appendPath('novel.json') ->> readNovelMetadata));
    return zipWith(extendWithPath, files.map(normaliseNovel), dirs);
  }
}
{% endhighlight %}

This is not an exhaustive list by any means. The point, rather, is that there
isn't a single form of "programming". Drawing on the screen can be programming,
dragging elements around can be programming, English can be programming. If
you're curious, Bret Victor has [a great talk showing some of the history of
programming and the different tools that were invented along the way](https://vimeo.com/71278954).


## 2. Programming and Languages







