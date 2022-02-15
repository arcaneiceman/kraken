import React from 'react'
import SocialLogin from 'react-social-login'
 
class SocialLoginWrapper extends React.Component {
 
    render() {
        return (
            <div onClick={this.props.triggerLogin} {...this.props}>
              { this.props.children }
            </div>
        );
    }
}
 
export default SocialLogin(SocialLoginWrapper);