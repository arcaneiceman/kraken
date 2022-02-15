package com.arcaneiceman.kraken.krakenserver.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.io.Serializable;
import java.util.Date;

/**
 * A user.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(of = {"id", "email", "name", "authority"})
@EqualsAndHashCode(of = "id")
@Table(name = "users")
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
public class User implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    private String id;

    @NotNull
    @Email
    @Size(min = 1, max = 50)
    @Column(length = 50, unique = true, nullable = false)
    private String email;

    @NotNull
    @Column
    private String name;

    @JsonIgnore
    @Size(min = 60, max = 60)
    @Column(length = 60)
    private String password;

    @NotNull
    @JsonIgnore
    @Column
    private String authority;

    @NotNull
    @JsonIgnore
    @Column
    private Boolean isActive;

    @Size(max = 20)
    @Column(length = 20)
    @JsonIgnore
    private String activationKey;

    @Column
    private Long createdAt;

    public User(String name, String email, String authority) {
        this.name = name;
        this.email = email;
        this.authority = authority;
        this.createdAt = new Date().getTime();
    }

    public String getUsername() {
        return email;
    }

    public void setUsername(String username) {
        this.email = username;
    }
}
