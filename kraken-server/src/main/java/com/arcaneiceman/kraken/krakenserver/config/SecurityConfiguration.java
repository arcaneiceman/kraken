package com.arcaneiceman.kraken.krakenserver.config;

import com.arcaneiceman.kraken.krakenserver.security.AuthoritiesConstants;
import com.arcaneiceman.kraken.krakenserver.security.Http401UnauthorizedEntryPoint;
import com.arcaneiceman.kraken.krakenserver.security.filters.*;
import com.arcaneiceman.kraken.krakenserver.service.utils.SwaggerService;
import com.arcaneiceman.kraken.krakenserver.service.utils.TokenBlacklistService;
import com.arcaneiceman.kraken.krakenserver.service.utils.TokenService;
import com.arcaneiceman.kraken.krakenserver.service.utils.VersionService;
import de.codecentric.boot.admin.server.config.AdminServerProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

import javax.annotation.PostConstruct;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfiguration {

    private final AuthenticationManagerBuilder authenticationManagerBuilder;

    private final UserDetailsService userDetailsService;

    @Autowired
    public SecurityConfiguration(AuthenticationManagerBuilder authenticationManagerBuilder,
                                 UserDetailsService userDetailsService) {
        this.authenticationManagerBuilder = authenticationManagerBuilder;
        this.userDetailsService = userDetailsService;
    }

    @PostConstruct
    public void init() throws Exception {
        authenticationManagerBuilder.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Order(1)
    @Configuration
    public static class ApplicationSecurity extends WebSecurityConfigurerAdapter {

        private final TokenService tokenService;

        private final TokenBlacklistService tokenBlacklistService;

        private final VersionService versionService;

        @Value("${application.context-path}")
        private String applicationContextPath;

        public ApplicationSecurity(TokenService tokenService,
                                   TokenBlacklistService tokenBlacklistService,
                                   VersionService versionService) {
            this.tokenService = tokenService;
            this.tokenBlacklistService = tokenBlacklistService;
            this.versionService = versionService;
        }


        @Bean
        public AuthenticationManager authenticationManagerBean() throws Exception {
            return super.authenticationManagerBean();
        }

        @Bean
        public Http401UnauthorizedEntryPoint http401UnauthorizedEntryPoint() {
            return new Http401UnauthorizedEntryPoint();
        }

        @Override
        protected void configure(HttpSecurity http) throws Exception {
            // Apply API Security
            http.antMatcher(applicationContextPath + "/**")
                    // Allow All Users (Endpoint security is managed by the endMarker point)
                    .authorizeRequests().anyRequest().permitAll()
                    .and()
                    .addFilterBefore(ApplicationCorsFilter.getCorsFilter(), UsernamePasswordAuthenticationFilter.class)
                    .addFilterBefore(new VersionFilter(versionService), UsernamePasswordAuthenticationFilter.class)
                    .addFilterBefore(new JWTValidateFilter(tokenService), UsernamePasswordAuthenticationFilter.class)
                    .addFilterBefore(new JWTBlacklistFilter(tokenBlacklistService), UsernamePasswordAuthenticationFilter.class)
                    .exceptionHandling()
                    .authenticationEntryPoint(http401UnauthorizedEntryPoint())
                    .and()
                    .csrf()
                    .disable()
                    .headers()
                    .frameOptions()
                    .disable()
                    .and()
                    .sessionManagement()
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS);
        }
    }

    @Order(2)
    @Configuration
    public static class SpringBootAdminSecurity extends WebSecurityConfigurerAdapter {

        private final AdminServerProperties adminServer;

        public SpringBootAdminSecurity(AdminServerProperties adminServer) {
            this.adminServer = adminServer;
        }

        @Override
        protected void configure(HttpSecurity http) throws Exception {
            SavedRequestAwareAuthenticationSuccessHandler successHandler =
                    new SavedRequestAwareAuthenticationSuccessHandler();
            successHandler.setTargetUrlParameter("redirectTo");
            successHandler.setDefaultTargetUrl(this.adminServer.getContextPath() + "/");

            http.antMatcher(this.adminServer.getContextPath() + "/**")
                    .authorizeRequests()
                    .antMatchers(this.adminServer.getContextPath() + "/assets/**").permitAll()
                    .antMatchers(this.adminServer.getContextPath() + "/login").permitAll()
                    .anyRequest().hasAuthority(AuthoritiesConstants.SYSTEM_ADMIN)
                    .and()
                    .formLogin()
                    .loginPage(this.adminServer.getContextPath() + "/login")
                    .successHandler(successHandler)
                    .and()
                    .logout()
                    .logoutUrl(this.adminServer.getContextPath() + "/logout")
                    .and()
                    .httpBasic()
                    .and()
                    .csrf()
                    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                    .ignoringAntMatchers(
                            this.adminServer.getContextPath() + "/instances",
                            this.adminServer.getContextPath() + "instances/*",
                            this.adminServer.getContextPath() + "/actuator/**");
        }
    }

    @Order(3)
    @Configuration
    public static class ActuatorSecurity extends WebSecurityConfigurerAdapter {

        @Override
        protected void configure(HttpSecurity http) throws Exception {
            http.antMatcher("/actuator/**")
                    .authorizeRequests().anyRequest().hasAuthority(AuthoritiesConstants.SYSTEM_ADMIN);
            http.httpBasic();
        }

    }

    @Order(4)
    @Configuration
    public static class SwaggerSecurity extends WebSecurityConfigurerAdapter {

        private final SwaggerService swaggerService;

        public SwaggerSecurity(SwaggerService swaggerService) {
            this.swaggerService = swaggerService;
        }

        @Override
        protected void configure(HttpSecurity http) throws Exception {
            http.antMatcher(swaggerService.getSwaggerContextPath() + "/**")
                    .addFilterBefore(new SwaggerFilter(swaggerService), BasicAuthenticationFilter.class)
                    .authorizeRequests().anyRequest().permitAll();
        }

    }

}
