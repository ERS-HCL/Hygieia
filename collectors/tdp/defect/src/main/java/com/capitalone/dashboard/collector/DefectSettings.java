package com.capitalone.dashboard.collector;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Bean to hold settings specific to the Defect collector.
 */
@Component
@ConfigurationProperties(prefix = "defect")
public class DefectSettings {
    private String cron;
    private String username;
    private String password;
    private List<String> servers;
    private String webdriver;

    public String getWebdriver() {
        return webdriver;
    }

    public void setWebdriver(String webdriver) {
        this.webdriver = webdriver;
    }

    public String getDownloadpath() {
        return downloadpath;
    }

    public void setDownloadpath(String downloadpath) {
        this.downloadpath = downloadpath;
    }

    private String downloadpath;



    public String getSsoURL() {
        return ssoURL;
    }

    public void setSsoURL(String ssoURL) {
        this.ssoURL = ssoURL;
    }

    public String getSuccessURL() {
        return successURL;
    }

    public void setSuccessURL(String successURL) {
        this.successURL = successURL;
    }

    public String getSonarLoginInitURL() {
        return sonarLoginInitURL;
    }

    public void setSonarLoginInitURL(String sonarLoginInitURL) {
        this.sonarLoginInitURL = sonarLoginInitURL;
    }

    private String ssoURL;
    private String successURL;
    private String sonarLoginInitURL;

    public String getSesionInitURL() {
        return sesionInitURL;
    }

    public void setSesionInitURL(String sesionInitURL) {
        this.sesionInitURL = sesionInitURL;
    }

    public String getSessionAuthURL() {
        return sessionAuthURL;
    }

    public void setSessionAuthURL(String sessionAuthURL) {
        this.sessionAuthURL = sessionAuthURL;
    }

    private String sesionInitURL;
    private String sessionAuthURL;






    public String getCron() {
        return cron;
    }

    public void setCron(String cron) {
        this.cron = cron;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }


    public List<String> getServers() {
        return servers;
    }

    public void setServers(List<String> servers) {
        this.servers = servers;
    }


}
