**Quality Metrics Dashboard Developer Guide**

**Repo Detail**

[_https://github.com/ERS-HCL/metrics_](https://github.com/ERS-HCL/metrics)

**How to do UI Build **

1. Clone this project -  [https://github.com/ERS-HCL/metrics](https://apac01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fgithub.com%2FERS-HCL%2Fmetrics&amp;data=02%7C01%7Cbegin.samuel%40hcl.com%7C62ad7938c63e440addd208d5bb377e83%7C189de737c93a4f5a8b686f4ca9941912%7C0%7C0%7C636620769393997569&amp;sdata=nDbQf2X3dvN5ihKaXNMw4GlhE4%2BB7EHlMuJqSPjHHnQ%3D&amp;reserved=0)
2. Go to UI directory
3. npm install -g
4. npm install bower
5. bower install
6. npm install gulp
7. gulp build

**How to do BE Build**

1. Clone this project -  [https://github.com/ERS-HCL/metrics](https://apac01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fgithub.com%2FERS-HCL%2Fmetrics&amp;data=02%7C01%7Cbegin.samuel%40hcl.com%7C62ad7938c63e440addd208d5bb377e83%7C189de737c93a4f5a8b686f4ca9941912%7C0%7C0%7C636620769393997569&amp;sdata=nDbQf2X3dvN5ihKaXNMw4GlhE4%2BB7EHlMuJqSPjHHnQ%3D&amp;reserved=0)
2. Go to cloned project directory
3. mvn clean install package

**How to run BE Application**

1. go to Demo2 directory
2. java -jar api.jar
3. run UI as well. find steps to run UI below mail.
4. make sure mongo db is up and running
5. in case mongo db is down, please restart it.

**How to run FE Application**

1. go to UI Folder
2. gulp serve

**How to Start Mongo DB:**

1. go to mongodb folder
2. mongod.exe --dbpath=..\data

**How to run Collectors**

**It is used to collect real-time data from all sources for the new configured dashboard / existing dashboard**

1. go to collectors folder
2. For instance go to scm/bitbucket/target folder
3. java -jar bitbucket-scm-collector-2.0.5-SNAPSHOT.jar  --spring.config.location=.\properties\bitbucket.properties

**Screen shots**
<img  align="top" src="/docs/buildexecution.png">

**Dashboards**
<img  align="top" src="/docs/dashboard2.png">


**Caching/JWT Token issue**

In case If you face any such issue, please clear cache in local browser and try it out.
