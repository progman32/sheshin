# Sheshin #

_she_: Knowing  
_shin_: As it is

An in-memory hierarchical key-value store (think objects) capable of providing change notifications at arbitrary keypaths.

Sheshin exposes one class, Store.

The read API is based on RX Observables, and is the only public API of Store. This API is wholly comprised of a single function, observe(), which takes a dot-delimited keypath.

The write API is only provided via callback to the code calling Store's constructor. The intent is to enforce unidirectional data flow (any mutation to a Store's state is mediated by the code instantiating the Store), similar to React's design philosophy. This API is wholly composed of a single function, set(), which takes a dot-delimited keypath and a value.

This is at the design idea stage, see the tests for API usage.

Internally, Store very thinly wraps an instance of Backing, which does the heavy lifting.

https://books.google.com/books?id=9QHEAwAAQBAJ&lpg=PT352&ots=DPmNPsrnWA&dq=trenpa&pg=PT352#v=onepage&q=trenpa&f=false

Run the tests with npm test.
