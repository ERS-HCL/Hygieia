package com.capitalone.dashboard.auth.access;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
@PreAuthorize(DashboardOwnerOrTeam.IS_DASHBOARD_OWNER_OR_TEAM)
public @interface DashboardOwnerOrTeam {

	static final String IS_DASHBOARD_OWNER_OR_TEAM = "@methodLevelSecurityHandler.isTeamOwnerOfDashboard(#id) or hasRole('ROLE_TEAM')";
	
}
