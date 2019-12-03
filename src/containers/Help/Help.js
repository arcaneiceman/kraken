import React, { Component } from 'react';
import isElectron from 'is-electron';
import Toolbar from '../../components/Toolbar/Toolbar'
import Octicon, { Star, DesktopDownload, Rocket, Gear, GitPullRequest, Globe } from '@githubprimer/octicons-react';
import ScrollableAnchor from 'react-scrollable-anchor'
import { configureAnchors } from 'react-scrollable-anchor'
import krakenLogo from './../../assets/kraken-logo.png';
import createRequestButton from './../../assets/screenshots/create-new-request-button.png'
import createRequestModal from './../../assets/screenshots/create-new-request-modal.png'
import startWorkerButton from './../../assets/screenshots/start-worker-button.png'
import worker from './../../assets/screenshots/worker.png'

import classes from './Help.module.css'

configureAnchors({ offset: -100 });
class HowTo extends Component {

    render() {
        // NavLinks for Toolbar
        let navLinks = [];
        navLinks.push({ text: 'Login', onClick: () => { this.props.history.push('/login'); }, isPrimary: true });
        navLinks.push({ text: 'Register', onClick: () => { this.props.history.push('/register') } })
        navLinks.push({ text: 'Forgot Password', onClick: () => { this.props.history.push('/forgot-password'); } })
        const toolbar = isElectron() ? <Toolbar navLinks={navLinks} type='electron' /> : <Toolbar navLinks={navLinks} type='web' />

        return (
            <div>
                {toolbar}
                <div className={classes.sun}>
                    <h1>Kraken How To Guide</h1>
                </div>
                <div className={classes.panelContainer}>

                    <div className={classes.panel}>
                        <a href="#section1" className={classes.panelLink}>
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={Star} />
                            </div>
                            <h3 className={classes.panelTitle}>What is Kraken</h3>
                            <p className={classes.panelText}>Introduction</p>
                            <div className={classes.panelFooter} />
                        </a>
                    </div>

                    <div className={classes.panel}>
                        <a href="#section2" className={classes.panelLink}>
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={DesktopDownload} />
                            </div>
                            <h3 className={classes.panelTitle}>Installation</h3>
                            <p className={classes.panelText}>Mac, Unix and Windows installation</p>
                            <div className={classes.panelFooter} />
                        </a>
                    </div>

                    <div className={classes.panel}>
                        <a href="#section3" className={classes.panelLink}>
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={Rocket} />
                            </div>
                            <h3 className={classes.panelTitle}>How to Use Kraken</h3>
                            <p className={classes.panelText}>Step by step usage guide</p>
                            <div className={classes.panelFooter} />
                        </a>
                    </div>

                    <div className={classes.panel}>
                        <a href="#section4" className={classes.panelLink}>
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={Gear} />
                            </div>
                            <h3 className={classes.panelTitle}>Supported Algorithms</h3>
                            <p className={classes.panelText}>WPA/WPA2 etc</p>
                            <div className={classes.panelFooter} />
                        </a>
                    </div>

                    <div className={classes.panel}>
                        <a href="#section5" className={classes.panelLink}>
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={GitPullRequest} />
                            </div>
                            <h3 className={classes.panelTitle}>Help Out</h3>
                            <p className={classes.panelText}>Contribute to Kraken</p>
                            <div className={classes.panelFooter} />
                        </a>
                    </div>

                    <div className={classes.panel}>
                        <a href="#section6" className={classes.panelLink}>
                            <div className={classes.panelImageContainer}>
                                <Octicon icon={Globe} />
                            </div>
                            <h3 className={classes.panelTitle}>Donate</h3>
                            <p className={classes.panelText}>Help with costs of maintaining Kraken</p>
                            <div className={classes.panelFooter} />
                        </a>
                    </div>
                </div>

                <div className={classes.content}>
                    <div className={classes.logoContainer}>
                        <img alt="" src={krakenLogo} width="225" height="225" />
                    </div>

                    <ScrollableAnchor id={'section1'}>
                        <h3>What is Kraken</h3>
                    </ScrollableAnchor>
                    <p>
                        Kraken is an online distributed brute-force password cracking tool.
                        It allows you to parallelize password-list and `crunch` based cracking across multiple machines to create a cluster of crackers
                        which can be run within the brower without installation or a desktop application (coming soon). Kraken is easy to use, fault tolerant
                        and can adjust to different cracking speeds automatically.
                    </p>
                    <br />

                    <ScrollableAnchor id={'section2'}>
                        <h3>Installation</h3>
                    </ScrollableAnchor>
                    <h5>Browser Based Client</h5>
                    <p>
                        The brower based client does not need installation and can be run directly from a Chrome, Firefox and Safari Browser.
                            <br />
                        <strong>Note: </strong> The broswer based client can only access the CPU and hence is <strong>significantly</strong> slower than the deskop based client.
                    </p>
                    <br />

                    <h5>Desktop Based Client</h5>
                    <p> Coming Soon!</p>
                    <br />

                    <ScrollableAnchor id={'section3'}>
                        <h3>How do I use Kraken</h3>
                    </ScrollableAnchor>
                    <p>
                        <h5>Step 1</h5>
                        Start by clicking the "Create New Request" button on the toolbar which should open a modal.
                        <br />
                        <img src={createRequestButton} alt="" style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', objectFit: 'scale-down', width: '50%' }} />

                        <h5>Step 2</h5>
                        Fill the fields of the modal and press submit. The following example shows a WPA/WPA2 request being created.
                        <br />
                        <img src={createRequestModal} alt="" style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', objectFit: 'scale-down', width: '50%' }} />
                        <ol>
                            <li><strong>Request Name :</strong> This is the friendly name that Kraken will use to refer to this request. It does not have to be unique</li>
                            <li><strong>Request Type :</strong> This indicates what type of request it will be. Currently we support only WPA/WPA2</li>
                            <li><strong>WPA/WPA2 Target Network :</strong> Unique to WPA/WPA2, this field indicate which SSID you want to target in your packet capture</li>
                            <li><strong>WPA/WPA2 Packet Capture :</strong> Unique to WPA/WPA2, this is the packet capture file that contains the target handshake</li>
                            <li>
                                <strong>Password List :</strong> This field specifies which password lists you want to use to attempt to crack target WPA/WPA2 handshake.
                                You can add lists by clicking on the dropdown and pressing the add button and remove them by clicking on the pill in the display.
                            </li>
                            <li>
                                <strong>Crunch Parameters : </strong> This field specifies the crunch parameters you want to use to attempt to crack target WPA/WPA2 handshake.
                                Crunch is a program that allows you to generate candidate values based on 3 parameters : <strong>Minimum Length</strong>, <strong>Maximum Length </strong>
                                and <strong>Character Set</strong>. You can optionally also provide a starting value. In the example above, crunch will generate all combinations of
                                numbers of length 8. Click here learn more about <a href="https://tools.kali.org/password-attacks/crunch">crunch</a>.
                            </li>
                        </ol>

                        <h5>Step 3</h5>
                        A new request should have been created in the active request column. Now click the start worker button to create a worker. The worker will be assinged a random name
                        and should be visible in "Your Workers" column. If you have an active request, the worker will automatically fetch jobs from the server and start processing them.
                        <img src={startWorkerButton} alt="" style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', objectFit: 'scale-down', width: '50%' }} />
                        <img src={worker} alt="" style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', objectFit: 'scale-down', width: '50%' }} />
                        In the browser client, workers run within the browser with cracking being performed in Javascript and hence is much slower than the desktop client.
                        If you close the tab in which the worker is running, the worker will go offline. In the desktop client, cracking is performed by Hashcat which can utilize
                        the machine's CPU and other hardware like GPU and is <strong>much faster</strong>.
                    </p>
                    <br />

                    <ScrollableAnchor id={'section4'}>
                        <h3>Supported Algorithms</h3>
                    </ScrollableAnchor>
                    <p>
                        Currently Kraken supports only WPA/WPA2 only. We intend on adding more algorithms to it including NTLM.
                    </p>
                    <br />

                    <ScrollableAnchor id={'section5'}>
                        <h3>Help Out</h3>
                    </ScrollableAnchor>
                    <p>
                        If you would like to contribute to Kraken (either the server or client), email me at <a href="mailto:waliusmani@gmail.com">waliusmani[AT]gmail[DOT]com</a>
                    </p>
                    <br />

                    <ScrollableAnchor id={'section6'}>
                        <h3>Donate</h3>
                    </ScrollableAnchor>
                    <p>
                        If you like Kraken and want to donate to keep Kraken running healthy, feel free to donate to my Paypal
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
                                <input type="hidden" name="cmd" value="_donations" />
                                <input type="hidden" name="business" value="ZAKGHMTXN8D5E" />
                                <input type="hidden" name="item_name" value="Supporting website" />
                                <input type="hidden" name="currency_code" value="CAD" />
                                <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
                                <img alt="" border="0" src="https://www.paypal.com/en_CA/i/scr/pixel.gif" width="1" height="1" />
                            </form>
                        </div>
                    </p>
                    <br />
                </div>
            </div >
        )
    }
}

export default HowTo;