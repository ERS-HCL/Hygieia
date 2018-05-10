package com.capitalone.dashboard.auth.access;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
@PreAuthorize(TeamLead.HAS_ROLE_ROLE_TEAM)
public @interface TeamLead {

	static final String HAS_ROLE_ROLE_TEAM = "hasRole('ROLE_TEAM')";

}
