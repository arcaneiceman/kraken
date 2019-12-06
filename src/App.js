import React, { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import Home from './containers/Home/Home'
import Dashboard from './containers/Dashboard/Dashboard'
import Login from './containers/Login/Login'
import Register from './containers/Register/Register'
import Activation from './containers/Activation/Activation'
import ChangePassword from './containers/ChangePassword/ChangePassword'
import ForgotPassword from './containers/ForgotPassword/ForgotPassword'
import Upgrade from './containers/Upgrade/Upgrade';
import Help from './containers/Help/Help'
import AuthenticationService from './services/AuthenticationService'

import krakenLogo from './assets/kraken-logo.png';

class App extends Component {

	componentDidMount(){
		document.title = "kraken-client v" + process.env.REACT_APP_API_VERSION 
		// If Logged In, restart the refresh timer
		if (AuthenticationService.isLoggedIn())
			AuthenticationService.activeAuthRefresh();
	}

	render() {
		return (
			<BrowserRouter>
				<div className="App">
					<div style={{display: 'flex', justifyContent: 'center'}}>
						<img alt="" src={krakenLogo} style={{ marginTop: '2.5%', opacity: '0.05', objectFit: 'contain', position: 'absolute', maxHeight: window.innerHeight, 'zIndex': -1 }} />
					</div>
					<Switch>
						{/* Secure Routes */}
						<Route path="/change-password" component={ChangePassword} />
						<Route path="/dashboard" component={Dashboard} />
						{/* Insecure Routes */}
						<Route path="/activation" component={Activation} />
						<Route path="/login" component={Login} />
						<Route path="/register" component={Register} />
						<Route path="/forgot-password" component={ForgotPassword} />
						<Route path="/upgrade" component={Upgrade} />
						<Route path="/help" component={Help}/>
						<Route path="/" component={Home} />
					</Switch>
				</div>
			</BrowserRouter>
		);
	}

}

export default App;
