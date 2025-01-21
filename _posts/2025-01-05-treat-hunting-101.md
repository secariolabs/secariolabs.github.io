---
title: "Threat Hunting 101"
date: "2025-01-13T10:10:47+00:00"
tags: 
  - "threat hunting"
  - "CrowdStrike"
bg_image: "/assets/images/posts/threathunting101-image0.jpg"
author:
    name: "@vibeszzzs"
    url: "https://x.com/vibeszzzs"
---
First of all, it is necessary to define what threat hunting actually means in the cybersecurity world. In the constantly evolving landscape of cybersecurity, threat hunting has emerged as a critical proactive approach to identifying and neutralizing malicious activities that may have evaded detection by conventional security measures. Unlike traditional reactive security strategies, which focus on responding to known threats and alerts, threat hunting adopts a proactive stance, actively searching for signs of potential intrusion or compromise.

IOCs and TTPs are two crucial concepts in the world of cybersecurity, particularly in the context of threat hunting. Understanding their distinct roles is essential for effective threat detection and mitigation.

![](/assets/images/posts/threathunting101-image17.png)
_Figure 1 - Where threat hunting fits from detection to resolution._

## Indicators of Compromise (IOCs)

Indicators of compromise (IOCs) are specific pieces of information or data that suggest a potential security breach or compromise. They can be static or dynamic in nature, ranging from IP addresses and malware signatures to network traffic patterns and user behaviour anomalies. IOCs act as red flags, indicating that something unusual or potentially malicious is happening within an organization's network or systems.

Common examples of IOCs include:

* **Malware signatures**: Unique identifiers embedded in malicious software that can be detected by security tools.
* **IP addresses**: Network addresses associated with known malicious actors or compromised systems.
* **File hashes**: Unique digital fingerprints of files, often used to identify malicious or suspicious files.
* **Registry keys**: Windows system entries that attackers may modify to establish persistence or maintain control over compromised systems.

## Tactics, Techniques, and Procedures (TTPs)

Tactics, techniques, and procedures (TTPs) represent the methods and strategies employed by attackers to carry out their malicious activities. They describe the 'how' of an attack, outlining the steps, processes, and tools used by attackers to gain access, move laterally, exfiltrate data, or maintain persistence within a compromised system or network.

Understanding TTPs is crucial for threat hunting because it allows organizations to anticipate and identify attack patterns even before they have been observed or associated with specific IOCs. By identifying common TTPs used by known threat actors, organizations can develop proactive defences and detection mechanisms to prevent or disrupt attacks.

Examples of common TTPs include:

* **Initial Access**: Methods used by attackers to gain initial entry into a system or network, such as phishing emails, exploiting vulnerabilities, or social engineering.
* **Lateral Movement**: Tactics used by attackers to move within a network to expand their access and reach sensitive data or systems. Examples include using stolen credentials to log into other systems, exploiting software vulnerabilities, or using remote access tools.
* **Payload Delivery**: Methods used by attackers to deliver malicious code or payloads onto target systems, such as dropping malware, exploiting vulnerable applications, or using drive-by downloads.
* **Persistence**: Techniques used by attackers to maintain ongoing access to a compromised system or network, such as creating backdoors, installing persistence mechanisms, or altering system configurations.

In this article, we will showcase hunting based on IOCs and TTPs using the CrowdStrike EDR solution. Hunting can be performed using various log sources, which include SIEM logs, firewall logs, Sysmon logs, etc.

_Threat Hunting_ is usually driven by _Threat Intelligence_. We can rely on open-source intelligence or paid sources. Usually, when there are adversary campaigns against organizations, the IOCs of the attacks will be published after detection. We will give an example in the following showcase of the two scenarios.

## Scenario 1

In the day-to-day life of a Threat Hunter or SOC analyst, you will receive IOCs from colleagues from the Threat Intel team, or you may obtain them yourself. For this example, let’s put ourselves in the shoes of a Threat Hunter. You start the day and receive the following mail:
  
![](/assets/images/posts/threathunting101-image15.png)
_Figure 2 - Sample email from the TI team._

First of all, let’s check if we can see any connection attempts towards the remote server. Let’s get into CrowdStrike and try to build our first query, which will focus on whether anything regarding this domain has been observed. In the Data Lake search, we can build the following query, which will give us initial information on whether anything attempted such a connection:

![](/assets/images/posts/threathunting101-image10.png)
_Figure 3 - CrowdStrike simplified data lake search for any field containing the domain._

![](/assets/images/posts/threathunting101-image4.png)
_Figure 4 - CrowdStrike query used in the Data Lake._

Essentially, this first query just matches any string in any type of event that contains this domain. From the results, we can see that we have nine events, and one of them is an event related to a DNS request. What we want to do now is systematize the information to give us a better overview of the situation. Next, we want to check which hosts have generated these events and what exact type of event was generated.

For that, we can use a light query:

{: .no-stripes}
```text
tailofwhale.local | table([ComputerName, #event_simpleName])
````

![](/assets/images/posts/threathunting101-image6.png)
_Figure 5 - Table view of the above Data Lake query._

As we can see from the results, only one host seems to be affected. It’s time to look at the events and try to see what exactly happened. Thankfully, some of the events have a `CommandLine` field, which allows us to see the exact command that was executed:
  
![](/assets/images/posts/threathunting101-image5.png)
_Figure 6 - Preview of executed command lines found._

These events confirm our hypothesis that this host likely has a dropper on it. Fortunately, we have the hashes and the names of the file from the email. Let’s see if we can find it on the system. We will issue a simple query of the string name `Dropper.hta` to demonstrate how we could find it. Typically, we would use hashes, but sometimes naming also works.

After looking at the events from this search, we see the following:

![](/assets/images/posts/threathunting101-image2.png)
_Figure 7 - Results of the above query searching for a filename._

HTA files do not execute directly. When double-clicked, they are passed to the native Windows binary `mshta.exe`, which executes them on its behalf. `mshta.exe` acts as an HTML interpreter and loads the HTML from the HTA along with any DLLs that deal with script execution, executing the program all at once.

From the above event, we can confirm that the file provided by the TI team has been observed on the machine. Now, let’s actually connect to the machine itself and verify if the file is still there. Fortunately, most modern solutions provide remote connection capabilities for Incident Response purposes. In this case, we can simply click a "Connect to Host" button to gain remote access.

![](/assets/images/posts/threathunting101-image12.png)
_Figure 8 - Directory browsing using the remote connection tool in CrowdStrike called RTR._

We can see that the file is present on the system, along with some other useful information such as its creation time. From this point, we can contain the machine, investigate further leads, and so on. We will leave this for another time. The purpose of this showcase was to demonstrate how typical threat hunting is performed.

## Scenario 2

This time, we will showcase a hunt based on TTPs rather than basic IOCs. Again, we are stepping into the shoes of a Threat Hunter, who starts the week and sees this email. The example below is just a sample and would be more detailed in a real-life scenario:
  
![](/assets/images/posts/threathunting101-image3.png)
_Figure 9 - Sample email from the TI team (may be entirely different)._

Now, we have two paths for this hunt, as we have two leads. The first option would be to check for any interesting files being written to the `Temp` folders of our hosts recently. The other would be to check for any new, interesting registry keys in `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`.

Time to start! We will begin with a very generic search in our EDR, which will look like this:

![](/assets/images/posts/threathunting101-image9.png)
_Figure 10 - Generic Data Lake search to narrow the search scope._

This will match any events that include our Temp folder directory string. The next step would be to try and filter out the less relevant events. We can check the event types and see what might be of interest, as this current search will bring in a lot of irrelevant events. The Temp folder is an important part of the Windows operating system, and it is quite active. A lot of file-write processes take place there, as Windows and applications use the Temp folder to store temporary files. These temporary files are used for a variety of purposes, such as downloading files, installing software, and saving documents.

![](/assets/images/posts/threathunting101-image8.png)
_Figure 11 - Review of fields and results from the above query._

Now, we can build a more specific query, excluding irrelevant fields. One particularly useful field will be showcased afterward. Let’s look at our new query and see what results it might show us:
  
![](/assets/images/posts/threathunting101-image16.png)
_Figure 12 - Data Lake query filtering specific event types._

With this query, the information is presented in a more systematic way.

![](/assets/images/posts/threathunting101-image7.png)
_Figure 13 - Query results showing particular findings related to the selected event types._

Looking at these results, we observe some interesting events here. The name of our `.ps1` script seems suspicious, right? Before we log onto the machine to verify if something malicious is happening, we will review a useful field specific to the CrowdStrike EDR software. For clarity, we have modified the results display:
  
![](/assets/images/posts/threathunting101-image11.png)
_Figure 14 - Event of interest indicating a possible Auto-Start script being added._

The event type `AsepValueUpdate` is very useful here. This event is generated when a Microsoft Auto Start Execution Point registry key is updated. In this case, it points to that interesting `.ps1` script again. After logging onto the host and checking the file contents, we observe this Base64-encoded code:
  
![](/assets/images/posts/threathunting101-image1.png)
_Figure 15 - Event properties displaying the script content from the event highlighted in Figure 14._

For the sake of showcasing the threat, we will not decode or decompress it, but this is, in fact, a reverse shell written in PowerShell, granting remote access to an attacker.

## Key Takeaways

Threat hunting can be performed with different software and log sources. What was showcased here with CrowdStrike EDR is just one possibility. For example, using Sysmon logs, firewall logs ingested into a SIEM like Splunk or Elastic is also a viable way to perform this activity.

Threat hunting should be used as a proactive activity to identify and neutralize threats before they can cause harm. This is in contrast to reactive threat detection, which focuses on identifying and responding to threats after they have already been detected.

However, there are also some challenges to using threat hunting as a proactive activity:

* **It can be a resource-intensive process.** Threat hunting requires a team of skilled analysts who must collect, analyze, and interpret large amounts of data.
* **It can be difficult to prioritize threats.** With so many potential threats to consider, it can be challenging to determine which threats are the most urgent and need to be addressed first.
* **It can be difficult to measure the ROI of threat hunting.** The benefits of threat hunting are difficult to quantify, making it hard to justify the investment in this activity. In over 90% of cases, threat hunting activities may yield no findings.

Despite these challenges, threat hunting is an important part of a comprehensive cybersecurity strategy. By using threat hunting as a proactive activity, organizations can better protect themselves from the ever-evolving threat landscape.
