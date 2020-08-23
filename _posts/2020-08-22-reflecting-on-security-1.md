---
layout: article
title:  "Reflecting on Security: Logging"
snip:   Encapsulation is essential for security, but there are more ways to achieve it than what most PLs currently do.
categories: [security]
---

<h2>Table of Contents</h2>

  * TOC
{:toc}


## Introduction

Imagine that you're building a small web application that will have an HTTP
server. In order to monitor and investigate problems in this server, you want
to log information about these requests. But how do you ensure that no
secret information, such as passwords, leaks into your plain-text logs?

In this article we'll look into the interactions between reflection,
encapsulation, and thirdy-party code. And at how they make security troublesome
in mainstream programming languages. We'll also look into a few simple ideas
that can improve security capabilities (and make them more flexible).

> <strong class="heading">Note</strong>
> Code examples in this article are written in pseudo-code (a programming
> language that neither has a specification nor an implementation). You can
> read it with the semantics of any other applicative, strictly evaluated,
> pass-by-value functional/object-oriented language (that's most languages out
> there). Where semantics may diverge they'll be explained in context.
{: .note}


## A simple HTTP server

Let's imagine we need to build an HTTP server to support some web application.
This server will expose a JSON API for manipulating resources. Which means that
it will take HTTP requests containing JSON-structured data. And it will reply
to those requests with JSON-structured data as well.

What kind of data this server manipulates isn't important for what we're going
to discuss. But to make things more concrete, imagine it supports a web
application for rescue cats, and thus the operations revolve around adding
and removing cats from the shelter, and listing cats that are waiting for
adoption. The listing resource is public, as people looking at the app need
to see the fluffy-ball friends they can take home, but operations modifying
the list will require authentication.

In order to use the authenticated operations, we will provide a separate
operation where our clients can send their username and password, and receive
back an opaque authentication token (if everything is correct). They may then
persist this and use it to authorise future requests.

The authentication operation can be described as such:

```
type #credentials:
  username is #text (limited to letters, digits, and "-" as characters)
  password is #text (having at least 6 characters)

on POST /login (body is #credentials):
  let User = login with credentials;
  let Token = a fresh authentication token for User;
  reply with Token as JSON
```

For completeness, the other operations may be described as such:

```
type #cat:
  id is #uuid
  name is #text
  description is #text
  photo is #url
  adopted is #boolean

view #new-cat is #cat without id

on GET /cats:
  reply with the list of #cat entities where adopted is false, as JSON

on POST /cats (body is #new-cat), requiring authentication:
  let Id = a new unique identifier for a cat;
  let Cat = the new cat extended with the association {id = Id};
  add the Cat to the list of cats;
  return an empty response

on PUT /cats/<Id is #uuid>/adopted, requiring authentication:
  let Cat = a cat from the list of cats having the {id = Id} association;
  update the Cat to have {adopted = true};
  return an empty response

to handle authentication:
  let Token = the bearer token value in the X-Authorization header;
  reject the request if the token is not known to the server
```


## Debugging and Monitoring

Building the HTTP service is the easy part. Ensuring that it works, and does
the right thing, is the hard one. It doesn't help that you're interested in
very different pieces of data depending on which context of the service we're
talking about.

While you're developing the service, you want access to every piece of
information you can observe to ensure that it's doing what you expect it to
do. When you're testing, you want access to sensitive information to ensure
it's being treated correctly.

But when you're running it in production, access to any of these pieces of
information is a huge liability. It introduces a component of failure that
will impact real people's privacy and safety.

Accidentally leaking someone's password for such a service might not feel
immediatelly critical to some, "What would people even do with it? Mark more
cats as adopted?". But Disruption to the service aside (and the possibility of
using these powers to bully the people running the service), it might be that
the administrators of this cat shelter happened to use the same password elsewhere.
You can invalidate passwords in the services you manage, but not elsewhere. Given access
to a password, and knowledge of other public information, attackers could try to
overtake other accounts, like primary email or social network, and cause even
more damage. Sometimes this damage is enough to cause long-lasting trauma in
the victims. Sometimes it's enough to drive them to take their own lives.

So, even if it doesn't directly results in the death or the physical harm of
someone, security and privacy needs to be taken seriously. Of course, only
attackers are to blame for the damage caused. But we still need to do our best
to try and mitigate the potential for these failures and attacks.

In this case, what we want to mitigate is "leaking secret information in
production systems". I'm specifying "in production systems" here because in
testing environments, and while developing, these "secret" bits of information
are not, in fact, secret. They're not real passwords. They're not real
information on people.

This means that we want to ensure that when a password enters the system, it
only stays in places nothing else in the machine can read, and it's quickly
converted to something that can be used as a key without leaking the original
secret (as, again, that can be in use in other systems).

Unfortunately, our technology for computer systems and programming isn't really
on our side here. Let's consider the common use of logging to observe remote
systems.

A common implementation of request logging may be described as follows:

```
on request:
  log "Incoming request: " along with the data in the request;
  let Response = process the incoming request;
  log "Outgoing response: " along with the Response;
  reply with the Response
```

For simplicity, to "log" something here will mean that we add that information
to a plain text file in the machine that's running the service. One can then 
look at this text file to understand what is happening with the service.

Since this is a plain text file, we have to treat it as public data. Which
means that we can't afford to leak passwords into this file. Even if that file
is still confined to the machine running the service. Passwords should not be
readable by any humans other than the one inputting it.


## Explicit, contextual representations

We may have control over which request data is public and which request data
isn't by having a function that constructs the logged representation. This,
however, requires context to be provided into the request data, so that we
know what the semantics of each piece of information is, and what security
policies to use. This context is already there for **responses**, by
construction (assuming that we use typed representations). But for incoming
data, we need to first parse it into some kind of context or schema. The
`body is #type` annotations in our previous definitions will stand for
providing such parsing mechanism.

Because we essentially have two types in this service, and assuming that
representations already exist for standard library types, we need to provide
two additional representations:

```
define (Self is #credentials) show do
  ["username" -> Self username show];
end

define (Self is #cat) show do
  [
    "id" -> Self id show,
    "name" -> Self name show,
    "description" -> Self description show,
    "photo" -> Self photo show,
    "adopted" -> Self adopted show
  ]
end
```

> <strong class="heading">Dispatching</strong>
> The definitions above are dynamically dispatched depending on the type
> of the first argument (`Self` here). That means that which `show` function
> actually gets invoked depends on what the argument for such function is
> at runtime. In this case our `#request` type will just contain some arbitrary
> value as its `body`, so we need some way of applying a contextual
> representation to that. While a simpler alternative would be to have different
> request and response types for each context, that scales poorly, as each
> combination of pieces of data requires a new type do be defined.
{: .note .trivia }

While we're only dealing with request and response bodies here for the sake
of this article, the same idea of attaching context to pieces of information
(through parsing) can be applied to headers, query parameters, and other
portions of the data.


## Contextual representations, revisited

The definitions above achieve our goal of not leaking passwords (and other
private data) in production. However, we might still want to look at those
pieces of information in testing environments and when running the service
locally, while you're developing it.

We can do so by extending our representation functions with an idea of
execution context of some sort. By using environment variables or some other
form of providing configuration data to the executing application, we can
use this configuration to select our desired behaviour. 

```
define (Self is #credentials) show do
  if application context === 'production' then  
    ["username" -> Self username show]
  else
    [
      "username" -> Self username show,
      "password" -> Self password show
    ]
end
```

## Implicit representations

Defining representation functions for all of the types in your application
may not sound too bad. And maybe you're not a huge fan of having a type
representation for each distinct concept---languages like Clojure and Erlang
even encourage this by reusing lists, tuples, and maps for most things.

But there's one particular problem with having to define separate representation
functions. Programs aren't a static thing. Most of the time, you don't build
a program, look at it, and then say "Okay, we're done here. Good job, everyone!"

It does not end there.

A program is more like a living organism under constant evolution. It is never,
in fact, done---although one can decide to not work on it anymore.

Whenever a program evolves and the types change---and they **will** change,---
one needs to update the representation functions that were affected. This is
not so bad if you remove fields from the type, because your code will break,
and you'll learn that you missed updating parts of it. If you add new fields,
then nothing will break, but you won't see that information either. You might
eventually notice that you missed updating some functions while looking at the
logs. But if you change the information of a field there's nothing that will
tell you "here's what's affected by this change". And if you increase the
sensitivity of a piece of information, turning something previously public
into something private, there is a high chance that you'll leak that information
---precisely the thing we were trying to mitigate.

So less prone-to-human-errors way to approach this is one where there's no
way of changing the secrecy of a piece of data *without* updating its
representation. And one way to achieve this is to have the representation of
the type be automatically derived from its definition, while taking into
account some form of security annotation. Because of the problem we just
described, we want to make sure these security annotations exist within the
definition of the type itself, such that it's less likely that one would
miss it when updating the type.

Many languages provide a concept of "access" control, which can be also
repurposed for this:

```
type #credentials:
  username is #text (limited to letters, digits, and "-" as characters)
  <secret> password is #text (having at least 6 characters)
```

Here, the `<secret>` annotation marks a field in the type as sensitive, so
when generating a representation function for it the field can be omitted,
if needed by the execution context.

Some languages, like Haskell and Rust, allow this derivation to be done through
a compile-time program that looks at the definition, then generates code for the
function. The code becomes part of the resulting binary, so nothing happens at
runtime. Most other languages, instead, offer a runtime mechanism to inspect
the internal structure of the value during execution, which may be enriched with
meta-data from its definition. Reflection in .NET and Java have that role.


## Information flow

