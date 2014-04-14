audio-wave
==========

Distributed Audio over a Localized Device Network

__Requires MongoDb ~2.2__


Sockets

Admin
* -> Connect ()
* -> Select Session (sessionId)
* -> Request Sessions ()
* -> Request Clients ()
* -> Freeze Session ()
* <- List of sessions
* <- Session created
* <- Session empty
* <- List of clients
* <- Client Joined
* <- Client disconnected
* <- Session frozen
