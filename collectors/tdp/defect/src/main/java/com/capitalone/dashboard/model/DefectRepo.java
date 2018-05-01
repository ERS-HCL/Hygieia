package com.capitalone.dashboard.model;

/**
 * CollectorItem extension to store the instance, repo name and repo url.
 */
public class DefectRepo extends CollectorItem {
    protected static final String USERNAME = "userName";
    protected static final String QUERY_NAME = "queryName";
    protected static final String QUERY_URL = "queryURL";
    protected static final String PASSWORD = "password";

    public String getUserName() {
        return (String) getOptions().get(USERNAME);
    }

    public void setUserName(String userName) {
        getOptions().put(USERNAME, userName);
    }

    public String getQueryName() {
        return (String) getOptions().get(QUERY_NAME);
    }

    public void setQueryName(String queryName) {
        getOptions().put(QUERY_NAME, queryName);
    }

    public String getQueryURL() {
        return (String) getOptions().get(QUERY_URL);
    }

    public void setQueryURL(String queryURL) {
        getOptions().put(QUERY_URL, queryURL);
    }

    public String getPassword() {
        return (String) getOptions().get(PASSWORD);
    }

    public void setPassword(String password) {
        getOptions().put(PASSWORD, password);
    }

   /* @Override
    public boolean equals(Object o) {
        if (this == o) {
        	return true;
        }
        if (o == null || getClass() != o.getClass()) {
        	return false;
        }

        DefectRepo defectRepo = (DefectRepo) o;

        return getInstanceUrl().equals(defectRepo.getInstanceUrl()) && getRepoName().equals(defectRepo.getRepoName());
    }

    @Override
    public int hashCode() {
        int result = getInstanceUrl().hashCode();
        result = 31 * result + getRepoName().hashCode();
        return result;
    }*/
}
