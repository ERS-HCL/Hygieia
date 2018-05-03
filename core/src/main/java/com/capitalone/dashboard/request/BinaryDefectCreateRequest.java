package com.capitalone.dashboard.request;

import com.capitalone.dashboard.model.SCM;

import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * A request to create a BinaryArtifact.
 *
 */
public class BinaryDefectCreateRequest {


    public String getHygieiaId() {
        return hygieiaId;
    }

    public void setHygieiaId(String hygieiaId) {
        this.hygieiaId = hygieiaId;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }




    public String getQueryURL() {
        return queryURL;
    }

    public void setQueryURL(String queryURL) {
        this.queryURL = queryURL;
    }

    public String getDomainName() {
        return domainName;
    }

    public void setDomainName(String domainName) {
        this.domainName = domainName;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }


    public String getQueryName() {
        return queryName;
    }

    public void setQueryName(String queryName) {
        this.queryName = queryName;
    }



    @NotNull
    private String queryURL;
    private String domainName;
    private String userName;
    private String password;
    private String queryName;
    private String hygieiaId;
    @NotNull
    private long timestamp;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    private String type;




}
