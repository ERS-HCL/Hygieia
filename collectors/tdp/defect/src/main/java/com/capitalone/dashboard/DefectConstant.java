package com.capitalone.dashboard;

/**
 * Created by begin.samuel on 24-04-2018.
 */
public class DefectConstant {

    public enum ResponseStatus {
        SUCCESS(200, "Success"),
        FAILED(500, "Failed");

        private final int code;
        private final String message;

        private ResponseStatus(int code, String message) {
            this.code = code;
            this.message = message;
        }

        public int code() {
            return this.code;
        }

        public String getMessage() {
            return this.message;
        }
    }

    public enum DefectStatus{
        CANCELLED("Cancelled"),
        CLOSED("Closed"),
        OPEN("Open / In Analysis"),
        NEW("New"),
        DEFERRED("Deferred"),
        REJECTED("Returned / Rejected"),
        FAILED("Retest Failed"),
        INPROGRESS("Assigned / Fix in Progress"),
        RETEST_BLOCKED("Retest Blocked"),
        RETEST_COMPLETED("Retest Complete"),
        FIXED("Fixed"),
        Scheduled("Scheduled / Delivered");



        public String getStatus() {
            return status;
        }

        private final String status;
        private DefectStatus(String status) {
            this.status = status;
        }

        }


    public enum Severity{
        SEVERITY_1("Severity 1"),
        SEVERITY_2("Severity 2"),
        SEVERITY_3("Severity 3"),
        SEVERITY_4("Severity 4"),
        SEVERITY_5("Severity 5"),
        SEVERITY_6("Severity 6");
        public String getSeverity() {
            return severity;
        }
        private final String severity;
        private Severity(String severity) {
            this.severity = severity;
        }
    }


    public enum Priority{
        HIGH("High"),
        MEDIUM("Medium"),
        LOW("Low"),
        UNASSIGNED("Unassigned");
        public String getPriority() {
            return priority;
        }
        private final String priority;
        private Priority(String priority) {
            this.priority = priority;
        }
    }


    public final static String loginForm = "Login - Jazz Authorization Server";
    public final static String userIdField = "jazz_app_internal_LoginWidget_0_userId";
    public final static String secretField = "jazz_app_internal_LoginWidget_0_password";
    public final static String downloadButton = "jazz_ui_toolbar_Button_1";
}

