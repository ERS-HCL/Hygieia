package com.capitalone.dashboard.request;

import org.bson.types.ObjectId;

import javax.validation.constraints.NotNull;

public class BinaryDefectSearchRequest {


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

    public String getQueryName() {
        return queryName;
    }

    public void setQueryName(String queryName) {
        this.queryName = queryName;
    }

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

    @NotNull
    private String queryURL;
    private String domainName;
    private String queryName;
    private String hygieiaId;
    @NotNull
    private long timestamp;

}
