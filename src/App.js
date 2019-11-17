import React, { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import Dashboard from './containers/Dashboard/Dashboard'
import Login from './containers/Login/Login'
import Register from './containers/Register/Register'
import Activation from './containers/Activation/Activation'
import ChangePassword from './containers/ChangePassword/ChangePassword'
import ForgotPassword from './containers/ForgotPassword/ForgotPassword'
import Upgrade from './containers/Upgrade/Upgrade';

import AuthenticationService from './services/AuthenticationService'
import krakenLogo from './assets/kraken-logo.png';

class App extends Component {

	componentDidMount(){
		// If Logged In, restart the refresh timer
		if (AuthenticationService.isLoggedIn())
			AuthenticationService.activeAuthRefresh();
	}

	render() {
		return (
			<BrowserRouter>
				<div className="App">
					<div style={{display: 'flex', justifyContent: 'center'}}>
						<img alt="" src={krakenLogo} style={{ opacity: '0.05', objectFit: 'contain', position: 'absolute', maxHeight: window.innerHeight, 'zIndex': -1 }} />
					</div>
					<Switch>
						{/* Insecure Routes */}
						<Route path="/activation" component={Activation} />
						<Route path="/login" component={Login} />
						<Route path="/register" component={Register} />
						<Route path="/forgot-password" component={ForgotPassword} />
						<Route path="/upgrade" component={Upgrade} />
						{/* Secure Routes */}
						<Route path="/change-password" component={ChangePassword} />
						<Route path="/" component={Dashboard} />
					</Switch>
				</div>
			</BrowserRouter>
		);
	}

}

export default App;
