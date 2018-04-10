---
layout: post
title:  Notes From 5 Years of Language Design
snip:   What I've learned playing with languages and ideas these years, and where I am now
---

<h2>Table of Contents</h2>

  * TOC
{:toc}


## Introduction

Over the past 5 years I've focused on programming languages, although more from an academic and implementer point of view. I didn't have a clear vision of what I really wanted to do during all of this time, so a lot of it was just me finding out about interesting concepts people had come up with and playing around with them. And with variations of them.

These days I've pretty much settled in two aspects of languages: expressiveness, and modular extensions. While I'm calling the first "expressiveness" for a lack of better term, Wadler's famous [Expression Problem](http://homepages.inf.ed.ac.uk/wadler/papers/expression/expression.txt) is actually more about the latter one. I'll discuss these in more depth later.

This article is roughly a summary of the concepts and ideas I've learned through the years, contrasting their tradeoffs and applicabilities. As well as some of the things I'm playing around with now. Nothing novel, but might still be an interesting read.


## Expressiveness and Modular Extension

Programming is a social activity. Even when you do it alone, even if you try writing everything "from scratch", you're still building upon the work of several other people. They came up with new concepts, which most likely got extended over the years, and then ended up being used by you. I don't mean "used by you" just in the sense of importing a library or starting a process, but in a more general "learning from other's knowledge" sense.

Of course, once you look at things through that lens, everything we do is a social activity. We live in society, after all. There's just no way for us to not be social beings at this point. We need each other.

But let's get back to programming. If it's a social activity, shouldn't we try to optimise it for that? 
