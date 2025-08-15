---
title: "Navigating the Maze of Security Alerts: First Steps into Effective Triage"
date: "2025-01-05T10:24:47+00:00"
tags: 
  - "SecOps"
  - "threat hunting"
  - "CrowdStrike"
bg_image: "/assets/images/posts/navigatingthemazeofsecurityalerts-hero.webp"
---
Have you ever encountered a security alert in your environment and wondered: 'What is this? How should we investigate it?'" In this article, we'll aim to simplify the process of triaging an alert and provide best practices to identify malicious activity efficiently.

First, let's define **Security Operations (SecOps)** and how it functions. SecOps is a multidisciplinary approach involving processes, tools, and personnel dedicated to safeguarding an organization's information assets and infrastructure from cyberattacks. It involves continuous monitoring, analysis, and response to potential threats, ensuring that security measures are in place and operating effectively.

## 1. The Importance of Effective Security Triage

The typical day of a SecOps Analyst involves navigating through numerous security alerts. This can sometimes be overwhelming, especially if the company's resources only allow for a small SOC team. As a blue team, it's crucial to distinguish between _false positives_ and _genuine_ security threats that warrant further investigation. This article will provide examples to help correctly classify alerts and determine which ones require immediate attention.

Investigations can be time-consuming, making prioritisation essential. Alert fatigue is a common issue in cybersecurity that negatively affects analysts' efficiency and well-being. By effectively triaging alerts and prioritizing investigations, analysts can maintain focus and optimize their time, ensuring that genuine threats are addressed promptly.

## 2. Fundamentals of Alert Triaging

Alright, we understand why triage is important—let's take a look at several different alerts and try to classify whether they are malicious or not. One technique that we have found helpful during real investigations is to start using the five Ws:

1. **Who**: Identify the source of the alert.
2. **What**: Determine the type of alert and its potential impact.
3. **When**: Establish the time frame of the event and any potential patterns.
4. **Where**: Locate the affected systems or endpoints and identify any potential spread.
5. **Why**: Analyze the motivations and objectives behind the alert to understand the threat.

For the scenarios we will be analysing below, we will be using [CrowdStrike Security Solution](https://www.crowdstrike.com/). CrowdStrike is a next-generation Endpoint Detection and Response (EDR) solution that provides enhanced protection capabilities beyond traditional antivirus (AV) solutions.

### 2.1 Scenario 1

Let's look at the following alert:

![](/assets/images/posts/navigatingthemazeofsecurityalerts-image6.png)
_Figure 1 - Process tree execution of the alert._

![](/assets/images/posts/navigatingthemazeofsecurityalerts-image2.png)
_Figure 2 - Details page of the alert._

We can use the five Ws rule to perform some initial triaging.

1. **Who**: We can see the user in the `username` field, which in this case is **Bob**.
2. **What**: The alert has been classified as **Medium** severity. Furthermore, we can also see that it states custom intelligence via Indicator of Attack (IOA). In this case, the [custom IOA rules](https://www.crowdstrike.com/blog/tech-center/custom-ioas/) come from the vendor. The alert was triggered due to a connection towards a specified destination in the rule: **the sports news website `sportal.bg`**.
3. **When**: This can easily be seen in the `time` field, which states the date and hour.
4. **Where**: The `hostname` field shows the system name, which in this case is a **MacBook device**.
5. **Why**: The alert was raised due to a custom detection rule, as mentioned in the What question.

Next, we can focus on the alert named `Sportal.bg Test.` We can also check the domain on Open-Source Intelligence (OSINT) platforms like [VirusTotal](https://www.virustotal.com/):

![](/assets/images/posts/navigatingthemazeofsecurityalerts-image4.png)
_Figure 3 - OSINT platform VirusTotal information about a particular domain._

Let's look a bit deeper at the command line itself. The ping command is usually used to test connectivity and verify whether a destination is reachable. The command `ping -c 10 sportal.bg` sends 10 echo requests to the website `sportal.bg`. This means that the command asks the website to send back an echo response for each packet sent. The `-c` option specifies the number of packets to send, and 10 tells the command to send ten packets.

Combining the above-mentioned observations, we can draw some conclusions.

By its nature, a command that is legitimate could also be malicious—it depends on the intent. In this case, we see that this is a custom rule that also includes the "Test" string. It is not uncommon for IT personnel to test certain configurations, and in practice, we encounter this frequently. In large corporations, it is possible to see different IT teams changing configurations in security solutions like EDRs, firewalls, AVs, etc.

In summary, this alert would be classified as a _false positive_. However, if you have contact with the person who triggered it, you could always reach out to confirm why they executed that command.

### 2.2 Scenario 2

In the next scenario, we are presented with the following alert:

![](/assets/images/posts/navigatingthemazeofsecurityalerts-image5.png)
_Figure 4 - Process tree execution of the alert._

![](/assets/images/posts/navigatingthemazeofsecurityalerts-image3.png)
_Figure 5 - Details page of the alert._

Let's follow the same methodology as before.

We have a security alert on the victim host's workstation, detected at **14:05**. The user on the machine, named "Victim" triggered a native detection from the EDR solution. The description is self-explanatory: **a PowerShell script with malicious characteristics was recognized by the EDR**. This is not a custom detection created by someone but rather a native detection from the security solution.

An experienced security analyst would likely recognize the nature of this detection immediately, but let's walk through it together. PowerShell is often utilized by threat actors. Experienced attackers tend to use more advanced techniques, such as shellcode injection and in-memory execution, making detection more difficult. However, not all adversaries are equally sophisticated—some may simply use PowerShell for basic command execution.

Since this detection involves PowerShell, it is important to understand what exactly was executed. Conveniently, the security solution provides detailed information about the executed command:

![](/assets/images/posts/navigatingthemazeofsecurityalerts-image1.png)
_Figure 6 - Process operation section of the detection, showing command-line execution._

Let's break it down together:

1. The first three lines relate to manual checks for detecting malicious content. If **AMSI** is active, it allows defenders to inspect whether the threat actor's actions would be detected. AMSI (Antimalware Scan Interface) is a built-in Windows security feature that provides visibility into scripts executed by PowerShell, VBScript, and JScript.
2. After that, we see the command `Invoke-Mimikatz`. A quick Google search reveals multiple articles about it. **Mimikatz** is a widely known tool used for credential theft, supporting attacks such as Pass-the-Hash, Golden Ticket, and DCSync attacks.
3. With all this information, we can confidently conclude that the observed actions are highly likely malicious and require further investigation. The presence of the `Invoke-Mimikatz` command strongly suggests an attempt to **steal credentials** from the system. Even though the EDR blocked the execution, this does not mean the incident is resolved. A deeper investigation is necessary to determine whether other systems have been targeted, how the attacker gained access, and whether any credentials have already been compromised. These questions fall under the Incident Response process, which is beyond the scope of this article and deserves its own dedicated discussion.

## 3. Tips on Triaging Alerts for Easier Investigations

### 3.1. Harnessing Open-Source Tools

A wealth of open-source tools is available to empower security analysts in their daily tasks. These free-to-use tools, such as VirusTotal, [Cisco Talos](https://www.talosintelligence.com/), and [any.run](https://any.run/), can significantly enhance alert analysis and provide valuable context around alert artifacts. By leveraging these tools, analysts can quickly analyze alerts, gain deeper insights into potential threats, and prioritize their response efforts.

### 3.2 Leveraging Artificial Intelligence (AI) Models

AI has gained significant traction in recent years, offering immense potential to enhance the daily operations of security analysts. One notable application is command explanation. Not every analyst has expertise in all commands across various operating systems. However, AI-powered tools like ChatGPT and Gemini assist by providing detailed explanations of commands and processes, saving analysts valuable time.

**Crucial Note**: Always anonymise sensitive data before submitting it to AI-powered tools, replacing real usernames or hostnames with fictitious values.

### 3.3 Reducing Repeat Investigations by Leveraging Historical Data

Repetitive alerts classified as _false positives_ can waste time and distract analysts from genuine threats. Leveraging historical data effectively can mitigate this issue. These repetitive events not only waste analysts' time but also divert attention away from genuine threats. To mitigate this, a system that leverages historical alert data is essential. We cannot stress enough how often alerts that were dismissed earlier in the week get re-investigated unnecessarily. Ongoing SOC fine-tuning is crucial to prevent these _false positives_ from recurring.
