package com.capitalone.dashboard.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;
import java.util.Date;

/**
 * Created by begin.samuel on 24-04-2018.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class Defect implements Serializable{


    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }



    public String getUser2() {
        return user2;
    }

    public void setUser2(String user2) {
        this.user2 = user2;
    }



    public String getUser1() {
        return user1;
    }

    public void setUser1(String user1) {
        this.user1 = user1;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }


    public Date getFixedDate() {
        return fixedDate;
    }

    public void setFixedDate(Date fixedDate) {
        this.fixedDate = fixedDate;
    }

    public Date getModifiedDate() {
        return modifiedDate;
    }

    public void setModifiedDate(Date modifiedDate) {
        this.modifiedDate = modifiedDate;
    }

    public Date getCreationDate() {
        return creationDate;
    }

    public void setCreationDate(Date creationDate) {
        this.creationDate = creationDate;
    }



    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public String getPageName() {
        return pageName;
    }

    public void setPageName(String pageName) {
        this.pageName = pageName;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getActions() {
        return actions;
    }

    public void setActions(String actions) {
        this.actions = actions;
    }

    public String getSubTeam() {
        return subTeam;
    }

    public void setSubTeam(String subTeam) {
        this.subTeam = subTeam;
    }

    @JsonProperty("Type")
    private String type;
    @JsonProperty("Id")
    private String id;
    @JsonProperty("Summary")
    private String summary;
    @JsonProperty("Owned By")
    private String owner;
    @JsonProperty("Status")
    private String status;
    @JsonProperty("Priority")
    private String priority;


    @JsonProperty("Severity")
    private String severity;
    //Apr 17, 2018 5:51 AM

    @JsonFormat(pattern = "MMM dd, yyyy hh:mm a")
    @JsonProperty("Modified Date")
    private Date modifiedDate;
    @JsonProperty("User 2")
    private String user2;

    @JsonFormat(pattern = "MMM dd, yyyy hh:mm a")
    @JsonProperty("Creation Date")
    private Date creationDate;
    @JsonProperty("User 1")
    private String user1;

    @JsonFormat(pattern = "MMM dd, yyyy hh:mm a")
    @JsonProperty("EST Fixed Date")
    private Date fixedDate;

    private String teamName;
    private String pageName;
    private int age;


    @JsonProperty("Created By")
    private String createdBy;
    @JsonProperty("Actions")
    private String actions;
    @JsonProperty("Application Fixed In SubTeam (Waterfall)")
    private String subTeam;

    public String getPhaseFoundInd() {
        return phaseFoundInd;
    }

    public void setPhaseFoundInd(String phaseFoundInd) {
        this.phaseFoundInd = phaseFoundInd;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public String getUser3() {
        return user3;
    }

    public void setUser3(String user3) {
        this.user3 = user3;
    }

    public String getUser4() {
        return user4;
    }

    public void setUser4(String user4) {
        this.user4 = user4;
    }

    public String getUser5() {
        return user5;
    }

    public void setUser5(String user5) {
        this.user5 = user5;
    }

    public String getUser6() {
        return user6;
    }

    public void setUser6(String user6) {
        this.user6 = user6;
    }

    public String getUser7() {
        return user7;
    }

    public void setUser7(String user7) {
        this.user7 = user7;
    }

    public String getUser8() {
        return user8;
    }

    public void setUser8(String user8) {
        this.user8 = user8;
    }

    @JsonProperty("Phase Found In")
    private String phaseFoundInd;
    @JsonProperty("Environment")
    private String environment;



    @JsonProperty("User 3")
    private String user3;

    @JsonProperty("User 4")
    private String user4;

    @JsonProperty("User 5")
    private String user5;
    @JsonProperty("User 6")
    private String user6;

    @JsonProperty("User 7")
    private String user7;

    @JsonProperty("User 8")
    private String user8;
}
