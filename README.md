<div align="center">
<img width="250" align="top" src="/UI/src/assets/img/hygieia_b.png"><a href="https://www.blackducksoftware.com/about/news-events/releases/2015-open-source-rookies-year"><img width="55" align="top" hspace="20" src="https://github.com/capitalone/Hygieia/blob/gh-pages/media/images/Rookies_Award_Badge.png"></a> 
</div>
<div align="center"> 
 This Metrics tool project is Forked from HYGIEIA  open source tool
</div>

<div align="center">
  <!-- Build Status -->
  <a href="https://travis-ci.org/capitalone/Hygieia.svg?branch=master"><img src="https://travis-ci.org/capitalone/Hygieia.svg?branch=master" alt="Build Status"/></a>
  <!-- Codacy Badge -->
  <a href="https://www.codacy.com/app/amit-mawkin/Hygieia"><img src="https://api.codacy.com/project/badge/grade/de1a2a557f8e458e9a959be8c2e7fcba"
      alt="Codacy Badge"/></a>
  <!-- Maven Central -->
  <a href="http://search.maven.org/#search%7Cga%7C1%7Ccapitalone"><img src="https://img.shields.io/maven-central/v/com.capitalone.dashboard/Hygieia.svg" alt="Maven Central"/></a>
  <!-- License -->
  <a href="https://www.apache.org/licenses/LICENSE-2.0"><img src="https://img.shields.io/badge/license-Apache%202-blue.svg"
      alt="License"/></a>
  <!-- Gitter Chat -->
  <a href="https://gitter.im/capitalone/Hygieia?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge"><img src="https://badges.gitter.im/Join%20Chat.svg" alt="Gitter Chat"/></a>
</div>

<table width="95%"  cellspacing"="0" "cellpadding"="0">
<tr><td width="10%"> Objectives </td> <td width="90%">&nbsp;</td><tr>
<tr><td>&nbsp;</td><td>
<ul><li>Automate Development Environment Setup</li>
<li>Continuous Performance Measurement and Visualization</li>
<li>Unified DevOps Dashboard</li></ul>
</td></tr>
<tr><td> Features </td> <td>&nbsp;</td><tr>
<tr><td>&nbsp;</td><td><ul>
<li>Visual Delivery Pipeline</li>
<li>Team Dashboard</li>
<li>Real-time Status</li>
<li>Configurable View</li>
</ul></td></tr>
<tr><td>Build</td><td></td></tr>
<tr><td>&nbsp;</td>
<td>
<ul> 
<li> This Metrics tool is using  Spring Boot to package the components as an executable JAR file with dependencies.</li>
<li> cmd:  mvn clean install package </li>
<li> This will build the following Components </li>
<ul>
<div>
```sh
└── Quality Metrics Tool
    ├── UI
    ├── API
    └── Collectors
        ├─ Feature
        │    ├── JIRA
        │    └── VersionOne
        └─ Repos
        '     ├── GitHub
        '     ├── GitLab
        '     ├── Subversion 
        '     └── Bitbucket
        '
        '
```
        and so on.  </div>
<div> To run the UI module, in the command prompt, navigate to \QualityMetrics\UI, and then execute the following com 
  <span> gulp build </span> </div>		
</td>
</tr>
<tr><td>Encrypt Properties to persist in Mongodb</td><td></td></tr>
<tr><td>&nbsp;</td>
<td>
<ul> 


<li>
   cmd:  java -cp ~/.m2/repository/org/jasypt/jasypt/1.9.2/jasypt-1.9.2.jar  org.jasypt.intf.cli.JasyptPBEStringEncryptionCLI input="dbpassword" password=hygieiasecret algorithm=PBEWithMD5AndDES
   <br/>
 For detail information, please refer the base code base :<a href="http://capitalone.github.io/Hygieia/setup.html"> Documentation </a>
</li></ul>
   		
</td>
</tr>
<tr><td>Sample Dashboard - Team along with Microservices View</td>
<td><img  align="top" src="/docs/dashboard.jpg"></td>
</tr>
<tr><td>Sample Dashboard - Team View</td>
<td><img  align="top" src="/docs/team.jpg"></td>
</tr>
<tr><td>IBM TDP Dashboard</td>
<td><img  align="top" src="/docs/tdp.jpg"></td>
</tr>
</table>
