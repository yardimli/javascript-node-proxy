A proof of concept pure javascript based proxy idea to use the browsers XMLHttpRequest to act as a go between proxy. All communication between target and destination is routed through websockets.

1) Communication between the client running localhost that will be mirrored to another PC is done by opening the localclient.html on the local machine.

2) On the destination machine we need to run the node script.

3) On the destination PC we can now fire up the browser and navigate to http://localhost:1337 which will now be mirroring the remote computers localhost.


Currently works with all file types and also sucessfully transmits headers cookies etc.
