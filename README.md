<p align="center">
  <img width="200" src="https://github.com/arcaneiceman/kraken/blob/master/kraken-client/src/assets/kraken-logo.png"/>
</p>

## Kraken: A multi-platform distributed brute-force password cracking system

<div id="{'introduction'}">

### What is Kraken

</div>

Kraken is an online distributed brute force password cracking tool. It allows you to parallelize dictionaries and crunch word generator based cracking across multiple machines both as a web app in a web browser and as a standalone electron based client. Kraken aims to be easy to use, fault tolerant and scalable.

I wrote Kraken because I wanted to learn more about offensive security and to write an easy solution to overcome the limitation of using a single device when attempting distribute brute force workloads.

<div id="{'installation'}">

### Installation

</div>

##### Server and Browser Client
Kraken is a dockerized application using <strong>docker-compose</strong> which will launch the <strong>db</strong> (Postgres), <strong>s3 compliant file storage</strong> (Minio),
the <strong>server</strong> and the <strong>browser client</strong>. You can find the docker-compose file at the root directory of the repository. You can deploy it using the following command:

```
docker-compose up
```
Kraken's Browser Client should be accessible at:
  - HTTP : <a href=http://localhost:8080>localhost:8080</a> (use server url <a href=" http://localhost:5000/api">http://localhost:5000/api</a> [default])
  - HTTPS : <a href="https://localhost:8443">https://localhost:8443</a> (use server url <a href="https://localhost:8443/api">https://localhost:8443/api</a>)

<strong>Note</strong>: To run the Browser Client from a remote machine, you <strong>MUST</strong> use HTTPS for both server url and browser url.
Eg. If you are hosting the server on 192.168.1.2, then browser client will be available at https://192.168.1.2:8443
and the server url should be https://192.168.1.2:8443/api

To upload password lists or dictionaries, upload them to Minio Console at <a href=http://localhost:9001>localhost:9001</a>. (Default U: admin P: password)
Otherwise, you can generate word lists dynamically using crunch. See crunch options and how to use them here:  <a href="http://manpages.ubuntu.com/manpages/bionic/man1/crunch.1.html">crunch man page</a>

Kraken's server runs on <a href=http://localhost:5000>localhost:5000</a> and also hosts swagger documentation at <a href=http://localhost:5000/swagger>localhost:5000/swagger</a>.

##### Portable Desktop Client

The desktop client is an electron based portable application and can be run on Mac, Windows and Linux. Due to sensitive permissions required to function, it is highly recommended that you compile and it yourself by cloning the repo and using : 

```
cd kraken-client
npm install
npm run electron-start
```

###### Windows
<strong>Note</strong>: Window EXE portable client needs to run in the folder with its hashcat dependencies. Hashcat files can be dowloaded from their home page or [here](https://hashcat.net/files/hashcat-5.1.0.7z).
Ive included a compressed zip file with the portable executable and required hashcat files. They can be downloaded:
  - <a href="https://github.com/arcaneiceman/kraken/releases/download/dockerUpdate/kraken-client.1.2.0.exe">Portable Exe</a>
  - <a href="https://github.com/arcaneiceman/kraken/releases/download/dockerUpdate/kraken-client-with-dependencies.zip">Compressed Zip</a>

###### Linux

Releases include a Linux **AppImage** which only requires hashcat to be installed. 

  - <a href="https://github.com/arcaneiceman/kraken/releases/download/dockerUpdate/kraken-client-1.2.0.AppImage">AppImage</a>

Install hashcat:
```
sudo apt-get install hashcat
```
You will have to give AppImage permission via properties to execute. 

### Note

This guide is on-going but please feel free to raise an issue or contact me for any help required.
