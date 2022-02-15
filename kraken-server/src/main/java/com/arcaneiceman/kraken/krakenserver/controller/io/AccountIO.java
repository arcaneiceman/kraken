package com.arcaneiceman.kraken.krakenserver.controller.io;

import io.swagger.annotations.ApiModel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class AccountIO {

    private static final int PASSWORD_MIN_LENGTH = 4;

    private static final int PASSWORD_MAX_LENGTH = 100;

    public static class Register {

        @Getter
        @NoArgsConstructor
        @ApiModel("Account.Create.Request")
        public static class Request {

            @NotBlank
            @Email
            @Size(min = 1, max = 50)
            private String email;

            @NotBlank
            private String name;

            @NotBlank
            @Size(min = PASSWORD_MIN_LENGTH, max = PASSWORD_MAX_LENGTH)
            private String password;

            @NotBlank
            @Size(min = PASSWORD_MIN_LENGTH, max = PASSWORD_MAX_LENGTH)
            private String confirmPassword;

            @NotNull
            private String recaptchaResponse;
        }

    }

    public static class Activate {

        @Getter
        @NoArgsConstructor
        @ApiModel("Account.Activate.Request")
        public static class Request {

            @NotBlank
            @Email
            @Size(min = 1, max = 50)
            private String email;

            @NotBlank
            private String activationKey;
        }

    }

    public static class Authenticate {

        @Getter
        @NoArgsConstructor
        @ApiModel("Account.Authenticate.Request")
        public static class Request {

            @NotBlank
            @Email
            @Size(min = 1, max = 50)
            private String email;

            @NotBlank
            @Size(min = PASSWORD_MIN_LENGTH, max = PASSWORD_MAX_LENGTH)
            private String password;

            @NotNull
            private String recaptchaResponse;

        }
    }

    public static class SocialAuthenticate {

        @Getter
        @NoArgsConstructor
        @ApiModel("Account.SocialAuthenticate.Request")
        public static class Request {

            @NotBlank
            private String provider;

            @NotBlank
            private String accessToken;

        }
    }

    public static class ChangePassword {

        @Getter
        @NoArgsConstructor
        @ApiModel("Account.ChangePassword.Request")
        public static class Request {

            @NotBlank
            @Size(min = PASSWORD_MIN_LENGTH, max = PASSWORD_MAX_LENGTH)
            private String oldPassword;

            @NotBlank
            @Size(min = PASSWORD_MIN_LENGTH, max = PASSWORD_MAX_LENGTH)
            private String newPassword;

            @NotBlank
            @Size(min = PASSWORD_MIN_LENGTH, max = PASSWORD_MAX_LENGTH)
            private String newConfirmPassword;
        }
    }

    public static class Common {

        @Getter
        @AllArgsConstructor
        @NoArgsConstructor
        @ApiModel("Account.Common.EmailRequest")
        public static class EmailRequest {

            @Email
            @NotBlank
            private String email;
        }


        @Getter
        @AllArgsConstructor
        @NoArgsConstructor
        @ApiModel("Account.Common.TokenResponse")
        public static class TokenResponse {

            private String token;
        }
    }
}

