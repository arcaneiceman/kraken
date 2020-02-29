# kraken-client
<img width="200" src="https://github.com/arcaneiceman/kraken-client/blob/master/src/assets/kraken-logo.png"/>

## Kraken: A multi-platform distributed brute-force password cracking system

Click <a href="https://kraken.work/help">here</a> for a guide to Kraken

### Change Log:

#### 1.1.0
NOTE : Due to breaking changes, you may still be seeing this notification on the v1.0.6 client.
Please update your client to the latest version. On browser, empty cache and hard reload.
For local client, go to the Kraken <a href="https://github.com/arcaneiceman/kraken-client/releases">release page</a> to download the latest version.
Updates:
- Browser auto-updates at new version release
- Active Requests can be made using both hccapx and cap/pcap files
- SSID specification in new requests is now optional. By default, Kraken will automatically 
target ALL SSIDs in a given hccapx or cap,pcap files. The optional filter can be used to specify
target(s) and all other handshakes will be discarded.
- Active Request now has details modal where you can better track your progress. This modal lets you
know the request metadata such as what handshakes were found in the hccapx or cap/pcap file, what the request
targets are, the filter parameters provided when making the request, which list is currently being run, and any 
partial results found.
- Complete Request also now as a details modal where you can all of the above information from the active request.
- Major internal code updates for a more streamlined and snappy experience. Do expect some bugs though, and please 
report them on the github page!

#### 1.0.6
Updates:
- These alerts that you are seeing now
- Added a note about multi-core (browser) / choosing devices (local)
- Added a note about packet capture not being accepted
- FAQ section in help
- Local Client enables dev console

Fixed Bug:
- Fixed previous release bug
- Change Password UI Fix
- Forget Password does not immediatly bump you to login
- If you delete remote worker, it shuts off now
- Request Name can be 40 characters now

#### 1.0.5
This update was scrapped.

#### 1.0.4
Fixed Bug:
- Bad event bus library needed cleanup code

#### 1.0.3
Updates:
- Electron app is now resizable
Fixed Bugs:
- Emails with symbols are now URL encoded
- Electron App dead links fixed
- Updates between various windows are now fast
- Closing Electron App while worker is running will give a prompt
- Transtion away from dashboard while worker is running will give a prompt

#### 1.0.2
Fixed Bugs:
- Auto logout after token expired
- Active core count not setting properly


