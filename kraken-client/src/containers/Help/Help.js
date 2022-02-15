import React, { Component } from 'react';
import isElectron from 'is-electron';
import Toolbar from '../../components/Toolbar/Toolbar'
import AuthenticationService from '../../services/AuthenticationService'
import SyntaxHighlighter from 'react-syntax-highlighter';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import Octicon, { Star, DesktopDownload, Rocket, Gear, GitPullRequest, LogoGithub, Heart, Alert, Shield } from '@githubprimer/octicons-react';
import { HashLink as ScrollableLink } from 'react-router-hash-link';
import krakenLogo from './../../assets/kraken-logo.png';
import CreateRequestButton from './../../assets/screenshots/create-new-request-button.png'
import CreateRequestModal from './../../assets/screenshots/create-new-request-modal.png'
import StartWorkerButton from './../../assets/screenshots/start-worker-button.png'
import Worker from './../../assets/screenshots/worker.png'

import classes from './Help.module.css'

class Help extends Component {

    render() {
        // NavLinks for Toolbar
        let navLinks = [];
        if (AuthenticationService.isLoggedIn())
            navLinks.push({ text: 'Dashboard', onClick: () => { this.props.history.push('/dashboard'); }, isPrimary: true });
        else
            navLinks.push({ text: 'Home', onClick: () => { this.props.history.push('/'); }, isPrimary: true });
//        navLinks.push({ text: 'Register', onClick: () => { this.props.history.push('/register') } })
//        navLinks.push({ text: 'Forgot Password', onClick: () => { this.props.history.push('/forgot-password'); } })
        const toolbar = isElectron() ? <Toolbar navLinks={navLinks} type='electron' /> : <Toolbar navLinks={navLinks} type='web' />

        return (
            <div>
                {toolbar}
                <div className={classes.sun}>
                    <h1>Kraken How To Guide</h1>
                </div>
                <div className={classes.panelContainer}>

                    <div className={classes.panel}>
                        <ScrollableLink smooth to="/help#introduction" className={classes.panelLink}>
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={Star} />
                            </div>
                            <h3 className={classes.panelTitle}>What is Kraken</h3>
                            <p className={classes.panelText}>Introduction</p>
                            <div className={classes.panelFooter} />
                        </ScrollableLink>
                    </div>

                    <div className={classes.panel}>
                        <ScrollableLink smooth to="/help#installation" className={classes.panelLink}>
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={DesktopDownload} />
                            </div>
                            <h3 className={classes.panelTitle}>Installation</h3>
                            <p className={classes.panelText}>Mac, Unix and Windows installation</p>
                            <div className={classes.panelFooter} />
                        </ScrollableLink>
                    </div>

                    <div className={classes.panel}>
                        <ScrollableLink smooth to="/help#how-to" className={classes.panelLink}>
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={Rocket} />
                            </div>
                            <h3 className={classes.panelTitle}>How to Use Kraken</h3>
                            <p className={classes.panelText}>Step by step usage guide</p>
                            <div className={classes.panelFooter} />
                        </ScrollableLink>
                    </div>

                    <div className={classes.panel}>
                        <ScrollableLink smooth to="/help#supported-algo" className={classes.panelLink}>
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={Gear} />
                            </div>
                            <h3 className={classes.panelTitle}>Supported Algorithms</h3>
                            <p className={classes.panelText}>WPA/WPA2 etc</p>
                            <div className={classes.panelFooter} />
                        </ScrollableLink>
                    </div>

                    <div className={classes.panel}>
                        <ScrollableLink smooth to="/help#privacy-policy" className={classes.panelLink}>
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={Shield} />
                            </div>
                            <h3 className={classes.panelTitle}>Privacy Policy</h3>
                            <p className={classes.panelText}>Check how we (don't) use your data</p>
                            <div className={classes.panelFooter} />
                        </ScrollableLink>
                    </div>

                    <div className={classes.panel}>
                        <a href="/help#disclaimer" className={classes.panelLink}>
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={Alert} />
                            </div>
                            <h3 className={classes.panelTitle}>Disclaimer</h3>
                            <p className={classes.panelText}>Please do not misuse this software</p>
                            <div className={classes.panelFooter} />
                        </a>
                    </div>

                    <div className={classes.panel}>
                        <ScrollableLink smooth to="/help#help-out" className={classes.panelLink}>
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={GitPullRequest} />
                            </div>
                            <h3 className={classes.panelTitle}>Help Out</h3>
                            <p className={classes.panelText}>Contribute to Kraken and Acknowledgements</p>
                            <div className={classes.panelFooter} />
                        </ScrollableLink>
                    </div>

                    <div className={classes.panel}>
                        <ScrollableLink smooth to="/help#donate" >
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={Heart} />
                            </div>
                            <h3 className={classes.panelTitle}>Donate</h3>
                            <p className={classes.panelText}>Help with costs of maintaining Kraken</p>
                            <div className={classes.panelFooter} />
                        </ScrollableLink>
                    </div>
                </div>

                <div className={classes.content}>
                    <div className={classes.logoContainer}>
                        <img alt="" src={krakenLogo} width="225" height="225" />
                    </div>

                    <div id={'introduction'}>
                        <h3>What is Kraken</h3>
                    </div>
                    <p>
                        Kraken is an online distributed brute force password cracking tool.
                        It allows you to parallelize dictionaries and crunch word generator based cracking across multiple machines both as a web app
                        in a web browser and as a standalone electron based client. Kraken aims to be easy to use, fault tolerant and scalable.
                        <br />
                        <br />
                        I wrote Kraken because I wanted to learn more about offensive security and to write an easy solution to overcome the limitation
                        of using a single device when attempting distribute brute force workloads.
                    </p>
                    <br />

                    <div id={'installation'}>
                        <h3>Installation</h3>
                    </div>

                    <h5>Server and Browser Client</h5>
                    <p>
                        Kraken is a dockerized application using docker-compose which will launch the <strong>db</strong> (Postgres), <strong>file storage</strong> (Minio),
                        the <strong>server</strong> and the <strong>browser client</strong>. You can deploy it using the following command:
                    </p>
                    <SyntaxHighlighter language="bash" style={github}>> docker-compose up</SyntaxHighlighter>


                    <p>
                        The browser client runs on <a href="http://localhost:3000">localhost:3000</a> by default and is accessible by all modern browsers.
                        However it is significantly <strong>significantly</strong> slower standalone client which can harness the system's GPU.
                    </p>

                    <h5>Portable Desktop Client</h5>
                        The desktop client is an electron based portable application and can be run on Mac, Windows and Linux.
                        Due to sensitive permissions required to function, it is highly recommended that you compile and it yourself using:
                        <SyntaxHighlighter language="bash" style={github}>> npm run electron-start</SyntaxHighlighter>

                        <h6>Windows</h6>
                        <p>
                            Releases include a zip file with the portable executable and required hashcat files.
                            Hashcat files can be dowloaded from their home page or <a href="https://hashcat.net/files/hashcat-5.1.0.7z">here</a>.
                        </p>

                        <h6>Linux</h6>
                        <p>
                            Releases include a Linux <strong>AppImage</strong> which only requires hashcat to be installed through :
                            <SyntaxHighlighter language="bash" style={github}>> sudo apt-get install hashcat</SyntaxHighlighter>
                        </p>

                        <br/>

                    <div id={'how-to'}>
                        <h3>How do I use Kraken</h3>
                    </div>
                        <div id={'how-to_wpa-guide'}><h4>Guide for WPA/WPA2</h4></div>

                        <h5>Step 1</h5>
                        The first step is to acquire a packet capture in pcap or cap format which contains the 4 way WPA/WPA2 handshake. To learn more about capturing handshakes
                        click <a href="https://www.kalitutorials.net/2014/06/hack-wpa-2-psk-capturing-handshake.html">here</a>.
                        There are numerous guides you can find on the net for
                        <a href="https://louisabraham.github.io/articles/WPA-wifi-cracking-MBP.html"> mac</a>,
                        <a href="https://www.aircrack-ng.org/doku.php?id=cracking_wpa"> linux </a> and
                        <a href="http://mohanthemass.blogspot.com/2015/03/wi-fi-wifi-is-short-form-for-wireless.html"> windows</a>.
                        These guides assume that your WiFi card supports the kind of attack you want to perform; if you want to passively capture handshakes, your card must be able to
                        go into monitor mode. For <strong>deauthentication</strong>, it needs to capable of performing packet injection.
                        <br />
                        <br />

                        <ul>
                            <li>
                                Use a Linux based device to install <strong>aircrack-ng</strong> suite.
                                <SyntaxHighlighter language="bash" style={github}>> sudo apt-get install aircrack-ng</SyntaxHighlighter>
                            </li>
                            <li>
                                 Use <strong>ifconfig</strong> to identify your WiFi interface. Lets assume its <strong>wlan0</strong>.
                                 <SyntaxHighlighter language="bash" style={github}>> ifconfig</SyntaxHighlighter>
                            </li>
                            <li>
                                Run <strong>besside-ng</strong> and watch the magic happen.
                                <SyntaxHighlighter language="bash" style={github}>> sudo besside-ng wlan0</SyntaxHighlighter>
                                The <strong>besside-ng</strong> program should create a file called <strong>wpa.cap</strong> in your <strong>home</strong> directory which you can upload to Kraken.
                            </li>
                        </ul>
                        <br />


                        <h5>Step 2</h5>
                        Start by clicking the "Create New Request" button on the toolbar which should open a modal.
                        <br />
                        <img src={CreateRequestButton} alt="" style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', objectFit: 'scale-down', width: '50%' }} />

                        <h5>Step 3</h5>
                        Fill the fields of the modal and press submit. The following example shows a WPA/WPA2 request being created.
                        <br />
                        <img src={CreateRequestModal} alt="" style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', objectFit: 'scale-down', width: '50%' }} />
                        <ol>
                            <li><strong>Request Name :</strong> This is the friendly name that Kraken will use to refer to this request. It does not have to be unique</li>
                            <li><strong>Request Type :</strong> This indicates what type of request it will be. Currently we support only WPA/WPA2</li>
                            <li><strong>Target Network SSID:</strong> Unique to WPA/WPA2, this field indicate which SSID you want to target in your packet capture </li>
                            <li><strong>Packet Capture CAP/PCAP:</strong> Unique to WPA/WPA2, this is the packet capture file that contains the target handshake </li>
                            <li>
                                <strong>Password List :</strong> This field specifies which password lists you want to use to attempt to crack target WPA/WPA2 handshake.
                                You can add lists by clicking on the dropdown and pressing the add button and remove them by clicking on the pill in the display. There are many
                                password lists to choose from including <strong>darkc0de.lst</strong>, <strong>rockyou.txt</strong>, <strong>bigWPA</strong> and others.
                            </li>
                            <li>
                                <strong>Crunch Parameters : </strong> This field specifies the crunch parameters you want to use to attempt to crack target WPA/WPA2 handshake.
                            Crunch is a program that allows you to generate candidate values based on 3 parameters : <strong>Minimum Length</strong>, <strong>Maximum Length </strong>
                                and <strong>Character Set</strong>. You can optionally also provide a starting value. In the example above, crunch will generate all combinations of
                            numbers of length 8. Click here learn more about <a href="http://manpages.ubuntu.com/manpages/bionic/man1/crunch.1.html"
                                    target="_blank" rel="noopener noreferrer">crunch</a>.
                            </li>
                        </ol>

                        <h5>Step 4</h5>
                        A new request should have been created in the active request column. Now click the start worker button to create a worker. The worker will be assinged a random name
                        and should be visible in "Total Workers" column. If you have an active request, the worker will automatically fetch jobs from the server and start processing them.
                        <img src={StartWorkerButton} alt="" style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', objectFit: 'scale-down', width: '50%' }} />
                        <img src={Worker} alt="" style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', objectFit: 'scale-down', width: '50%' }} />
                        In the browser client, workers run within the browser with cracking being performed in Javascript and hence is much slower than the desktop client.
                        If you close the tab in which the worker is running, the worker will go offline. In the desktop client, cracking is performed by Hashcat which can utilize
                        the machine's CPU and GPU so its <strong>much faster</strong>.
                        <br />  

                        <br /> 
                        <div id={'how-to_faq'}><h4>FAQs</h4></div>

                        <h5>What does Kraken do exactly?</h5>     
                        Kraken attempts to solve two key issues with brute-force password cracking. First, it lowers the barrier to entry by allowing users to crack passwords 
                        without having to install anything directly through their browser or a simple local client. No more downloading massive password lists! Second, 
                        it distributes workloads over multiple user-provided machines so you are not forced to crack on a single machine and can scale your cracking operation 
                        based on how you see fit. Kraken is fault-tolerant too so if a worker goes offline while processing a job, the job is tracked and recovered and given to
                        another worker.
                        <br /> 

                        <br /> 
                        <h5>Do I need multiple workers (browser windows) to use my multi-core machine more efficiently?</h5>
                        Kraken provides the ability to adjust the number of cores it uses on a single browser window so you do not need to open multiple tabs and run workers on them.
                        By default, Kraken will use [total core count of your machine] -1 cores. Hence, if your computer has an 8 core machine, by default Kraken will use 7 cores to 
                        crack so that the last core is free process UI changes and other tasks on your machine. You can lower this based on what on what you see fit.
                        <br /> 

                        <br /> 
                        <h5>Why does my local worker not work when I enable both my CPU and GPU?</h5>
                        If hashcat detects a GPU on your machine, it does not like enabling both CPU and GPU. While Kraken does allow you to force this,
                        hashcat will most likely throw many errors.
                        <br /> 

                        <br /> 
                        <h5>Why do you have node integration enabled on in the local client (electron app)?</h5>
                        The local app needs access to your machine's terminal to run hashcat. This is why the local app's script
                        policy is 'self' only packaged code and nothing else can be executed. Also, all of Kraken client code is available on Github for you to check and test.
                        <br /> 

                        <br /> 
                        <h5>Why does Kraken say "0 targets matched criteria"? </h5>
                        It means that target SSID you specified in the filter was not found in your capture. Kraken uses cap2hccapx from hashcat-utils to validate your packet capture. 
                        Use the <a href="https://www.onlinehashcrack.com/tools-cap-to-hccapx-converter.php" target="_blank" rel="noopener noreferrer">online tool</a> to verify it
                        if it is giving you trouble. I'll soon be adding direct hashes as part of the request so you can extract the PMK and other values yourself in a file.
                        <br /> 

                        <br /> 
                        <h5>Why does Kraken say "Unexpected fixed contents" ?</h5>
                        Are you sure you uploaded a cap/pcap/hccapx file. Be honest. Kraken certainly doesnt think so.
                        <br /> 
                    <br />

                    <div id={'supported-algo'}>
                        <h3>Supported Algorithms</h3>
                    </div>
                    <p>
                        Currently Kraken supports only WPA/WPA2 only. I intend on adding more algorithms but first I want to focus on WPA/WPA2
                    </p>
                    <br />

                    <div id={'privacy-policy'}>
                        <h3>Privacy Policy</h3>
                    </div>
                    <p>
                        Your privacy is important to us. It is Kraken's policy to respect your privacy regarding any information we may collect from you across our website, https://kraken.work, and other sites we own and operate.
                        We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
                        Information that is asked for is name and email. All other data is within your control and can be removed on the dashboard. No hash that is uploaded is kept longer than to service the active request.
                        We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.
                        We don’t share any personally identifying information publicly or with third-parties, except when required to by law.
                        You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.
                        Your continued use of our website will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.
                        This policy is effective as of 1 January 2020.
                    </p>
                    <br />

                    <div id={'disclaimer'}>
                        <h3>Disclaimer</h3>
                    </div>
                    <p>
                        <strong>Disclaimer : </strong> THIS SOFTWARE COMES WITH NO WARRANTY WHATSOEVER. THE AUTHOR IS NOT RESPONSIBLE FOR ANY DAMAGE CAUSED BY THE (MIS)USE OF THIS SOFTWARE!
                        <br />
                        This tool is meant for enthusiasts to attempt to break into system they control to learn pentration testing and do not want to go through the hassle of setting up their
                        own cracking cluster.
                    </p>
                    <br />

                    <div id={'help-out'}>
                        <h3>Help Out</h3>
                    </div>
                    <p>
                        <h5>Contribute Code to Kraken</h5>
                        If you would like to contribute to Kraken server, email me at <a href="mailto:waliusmani@gmail.com">waliusmani[AT]gmail[DOT]com</a>
                        and possibly join me in my journey to make usable security tools by becoming part of the Kraken team. If you would like to contribute
                        to Kraken Client, feel free to do so by creating a pull request or an issue at
                        <a href="https://github.com/arcaneiceman/kraken-client" target="_blank" rel="noopener noreferrer">
                            <button style={{ textAlign: 'center' }}> <Octicon icon={LogoGithub} /> </button>
                        </a>
                        I would gladly accept help if you want to join me as a part of the Kraken team as well.
                        <br />

                        <h5>Shout Out</h5>
                        I would like to give a shout out to the following teams/people that helped me make this possible in no particular order.
                        <ul>
                            <li><strong><a href="https://github.com/derv82" target="_blank" rel="noopener noreferrer">Derv82</a></strong></li>
                            <li><strong><a href="http://ttt.studio/" target="_blank" rel="noopener noreferrer" >TTT Studios</a></strong></li>
                            <li>All others who write amazing code to make all this possible</li>
                        </ul>
                    </p>
                    <br />

                    <div id={'donate'}>
                        <h3>Donate</h3>
                    </div>
                    <p>
                        Hi there! If you would like to contribute $1 or more for the smooth running of Kraken, it would be greatly appreciated.
                        If only a 100 people dontate, I could keep kraken running for 6 months! Any amount raised above the running costs will
                        be used to buy better infrastructure! Thank you!
                        <div className={classes.donationContainer}>
                            <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
                                <input type="hidden" name="cmd" value="_donations" />
                                <input type="hidden" name="business" value="ZAKGHMTXN8D5E" />
                                <input type="hidden" name="item_name" value="Supporting website" />
                                <input type="hidden" name="currency_code" value="CAD" />
                                <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
                            </form>
                            <p>Bitcoin Address</p>
                            <p className={classes.bitcoinAddress}>1ErQ7BSEB19cUbuqDwQRLb199sRVabA5w</p>
                        </div>
                    </p>
                    <br />
                </div>
            </div >
        )
    }
}

export default Help;