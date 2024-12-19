---
title: Protecting Assets Behind CloudFront
date: 2023-04-09T12:24:47+00:00
tags: 
  - aws
  - cloudfront
  - waf
bg_image: /assets/images/posts/depositphotos_56589681-stock-photo-business-overcomes-obstacles-applying-different.webp
---
One of the most common ways of bypassing a Web Application Firewall (WAF) involves finding out the backend servers' address and connecting to it directly. An IP can be leaked in many ways, including DNS history, HTTP headers, cookies, virtual host routing with shared infrastructure, stack traces leaking source code, successful server-side request forgery attacks, even sometimes you can find it in the JavaScript source map. And assuming you locate the IP you can then directly reach the server and bypass all the protections and logging that a WAF provides.

Very often during engagements, we assess web applications positioned behind AWS CloudFront, which by default is not a WAF but a Content Delivery Network (CDN) designed to speed up the loading time of a website by caching static files and delivering them quickly thanks to the many nodes CloudFront has all over the world. Even though CloudFront by default does not operate as a WAF, it does provide [an intuitive way](https://docs.aws.amazon.com/waf/latest/developerguide/cloudfront-features.html) of adding WAF rules which can then be applied on each request passing through the service. More often than not, we see them being used. The rules can either be a managed subscription by a third-party vendor (e.g., F5) or they can be inline, written manually by the application owner.

As AWS does not provide a simple way for developers to limit requests to their web applications (EC2) to be coming only from CloudFront, very often people try to improvise with different ways of enforcing the chain. For example, they use **tokens** -- [adding a custom HTTP header](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/add-origin-custom-headers.html) with a unique value which is sent with all requests from CloudFront and then verified on the web application server. While this is a strict technique relying on a shared secret, there are both security concerns with the secret leaking (when a header is reflected in the response), and it also adds a very large complexity as there must be an additional mechanism that can rotate the secret. Rotation involves changes to AWS resources and to the application logic, not to mention the potential downtime if these actions are not synchronized fully.

A lesser-known technique that [AWS has suggested](https://aws.amazon.com/blogs/security/automatically-update-security-groups-for-amazon-cloudfront-ip-ranges-using-aws-lambda/) [over the years](https://aws.amazon.com/blogs/security/how-to-automatically-update-your-security-groups-for-amazon-cloudfront-and-aws-waf-by-using-aws-lambda/) is to restrict access based on an IP address. While this sounds very much like what Cloudflare has as its default recommendation, with CloudFront things are a bit more complicated as AWS does not have a constant strict address pool for this service, but rather they rotate IP addresses frequently --- meaning that if you don't update the firewall immediately when a change occurs, you risk both downtimes as new requests could be coming from a non-approved IP address and attacks from servers/services that now have an IP address which was previously associated with CloudFront.

In this article we will build a lab in which we will 1) create a simple application behind CloudFront, 2) place some WAF rules and demonstrate the weakness, and 3) configure an IP-based restriction that should protect the end system.

## Setting up the Environment

For this example, we can create a simple web server in AWS with a *public* and a *private* page which we will then try to protect with WAF rules on CloudFront.

### Creating the Web Server

The first thing we need to do is create a security group with an inbound "allow all" rule for port 80:

```bash
$ aws ec2 create-security-group\
	--group-name ExampleWebsite\
	--description "Example Website for testing CloudFront with WAF rules"
{
    "GroupId": "sg-0de46ea030c72802c"
}
$ aws ec2 authorize-security-group-ingress\
	--group-id sg-0de46ea030c72802c\
	--protocol tcp --port 80 --cidr 0.0.0.0/0
```

Next, optionally, we can quickly create an SSH key to use for the new system:

```bash
$ aws ec2 create-key-pair\
	--key-name MyKeyPair\
	--query 'KeyMaterial'\
	--output text > MyKeyPair.pem
```

Finally, we will need a simple bash script `script.sh` to run at build time on the web server:

```bash
#!/bin/bash

yum update -y

yum install -y httpd.x86_64

systemctl start httpd.service

echo "This is a public page"  > /var/www/html/index.html

echo "secret"  > /var/www/html/private.html
```

With these prerequisites out of the way, now is time to just build the web server:

```bash
$ aws ec2 run-instances\
	--image-id ami-0ad97c80f2dfe623b\
	--instance-type t2.nano\
	--user-data file://script.sh\
	--security-group-ids sg-0de46ea030c72802c\
	--key-name MyKeyPair
{
    "Groups": [],
    "Instances": [{
        "AmiLaunchIndex": 0,
        "ImageId": "ami-0ad97c80f2dfe623b",
        "InstanceId": "i-0af0b1290214d5d95",
...
```

A couple of minutes later, it is possible to get the public IP of the system with the following command:

```bash
$ aws ec2 describe-instances\
	--instance-ids i-0af0b1290214d5d95\
	--query 'Reservations[*].Instances[*].PublicIpAddress'\
	--output text
18.133.242.145
```

Now is time to check the environment; we can quickly see that the server is up and the pages are there:

```bash
$ curl http://18.133.242.145
This is a public page
$ curl http://18.133.242.145/private.html
secret
```

### Setting up Route 53

To set up CloudFront, we will need to first create a DNS record for the web server. We already a hosted zone configured in the AWS account which we can use, as shown below:

```bash
$ aws route53 list-hosted-zones
{
    "HostedZones": [{
        "Id": "/hostedzone/Z0520503IHM7MMFXXXXX",
        "Name": "secariolabs.com.",
...

```

To create an `A` record mapping `private.demo.secariolabs.com` to the EC2 system, we will need the following `create-record.json` file:

```javascript
{
  "Comment": "Testing creating a record set",
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "private.demo.secariolabs.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{
        "Value": "18.133.242.145"
      }]
    }
  }]
}
```

Now is just a matter of making the request to Route 53, as shown below:

```bash
$ aws route53 change-resource-record-sets\
	--hosted-zone-id "/hostedzone/Z0520503IHM7MMFXXXXX"\
	--change-batch file://create-record.json
```

A couple of seconds later you can check that the record is active:

```bash
$ aws route53 get-change --id C018062338JPC4J7GN2I9
{
    "ChangeInfo": {
        "Id": "/change/C018062338JPC4J7GN2I9",
        "Status": "INSYNC",
        "SubmittedAt": "2023-04-07T00:50:12.606000+00:00",
        "Comment": "Testing creating a record set"
    }
}
```

And we can confirm that the site is still accessible:

```bash
$ curl http://private.demo.secariolabs.com
This is a public page
$ curl http://private.demo.secariolabs.com/private.html
secret
```

### Setting up CloudFront

The next step is to finally create the CloudFront distribution routing traffic to our website. To make the request to AWS we will need the following `distribution.json` file:

```javascript
{
  "CallerReference": "cf-cli-distribution",
  "Comment": "Example Cloudfront Distribution",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "private.demo.secariolabs.com",
      "DomainName": "private.demo.secariolabs.com",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "http-only",
        "OriginSslProtocols": {
          "Quantity": 1,
          "Items": ["TLSv1.2"]
        }
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "private.demo.secariolabs.com",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["HEAD", "GET"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["HEAD", "GET"]
      }
    },
    "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
  },
  "Enabled": true
}
```

And the final command to create it looks as follows:

```bash
$ aws cloudfront create-distribution --distribution-config file://distribution.json
{
    "Location": "https://cloudfront.amazonaws.com/2020-05-31/distribution/E3OSJ4978QOTZ2",
    "ETag": "E1Y4BASGKG03MO",
    "Distribution": {
        "Id": "E3OSJ4978QOTZ2",
        "ARN": "arn:aws:cloudfront::9536171XXXXX:distribution/E3OSJ4978QOTZ2",
        "Status": "InProgress",
        "LastModifiedTime": "2023-04-07T01:29:11.959000+00:00",
        "InProgressInvalidationBatches": 0,
        "DomainName": "d1489et6zspdol.cloudfront.net",
...
```

A couple of minutes later we can go ahead and check the connection to the site:

```bash
$ curl http://d1489et6zspdol.cloudfront.net -L
This is a public page
$ curl http://d1489et6zspdol.cloudfront.net/private.html -L
secret
```

### Adding a WAF Rule to CloudFront

The next task for us is to create a WAF rule which we can use to protect everything going to `/private*`. The following `waf-rule.json` file was created for this purpose (note that `L3ByaXZhdGU=` is `/private`):

```javascript
[{
  "Name": "basic-rule",
  "Priority": 0,
  "Statement": {
    "ByteMatchStatement": {
      "SearchString": "L3ByaXZhdGU=",
      "FieldToMatch": {
        "UriPath": {}
      },
      "TextTransformations": [{
        "Priority": 0,
        "Type": "NORMALIZE_PATH"
      }],
      "PositionalConstraint": "STARTS_WITH"
    }
  },
  "Action": {
    "Block": {}
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "basic-rule"
  }
}]
```

Time to create the rule, where you will notice it is specifically created for CloudFront and the `us-east-1` region even though our EC2 instance is in `eu-west-2`. The reason this is the case is because CloudFront only exists in `us-east-1` and the WAF rule(s) have to be in the same region, whereas because CloudFront maps to an external IP address, there is no strict requirement for the EC2 system to be in the same region.

```bash
$ aws wafv2 create-web-acl\
    --name TestWebAcl\
    --scope CLOUDFRONT\
    --default-action Allow={}\
    --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=TestWebAclMetrics\
    --rules file://waf-rule.json\
    --region us-east-1
{
    "Summary": {
        "Name": "TestWebAcl",
        "Id": "74941941-24b9-4b1e-b0c0-276a653aad85",
        "Description": "",
        "LockToken": "ba596cac-bdc8-490f-af7c-1f4734c720f3",
        "ARN": "arn:aws:wafv2:us-east-1:9536171XXXXX:global/webacl/TestWebAcl/74941941-24b9-4b1e-b0c0-276a653aad85"
    }
}
```

While the intuitive step at this moment would be to use `aws wafv2 associate-web-acl` this would not work. Applying WAF rules to CloudFront requires making updates to the configuration, rather than simply associating the rule. To make things even harder, AWS does not allow you to simply send an update with only the particular values you want to change, but rather you will need to download the configuration patch it and submit it again.

To Download the configuration file we can use the following command:

```bash
$ aws cloudfront get-distribution-config\
	--id E3OSJ4978QOTZ2\
	--query "DistributionConfig"\
	--output json > current-distribution.json
```

Next we can patch the `WebACLId` value to list the rule we want to be applied:

```bash
sed '/WebACLId/c\"WebACLId\":\"arn:aws:wafv2:us-east-1:9536171XXXXX:global/webacl/TestWebAcl/74941941-24b9-4b1e-b0c0-276a653aad85\",' current-distribution.json > updated-distribution.json
```

Finally, we can make an update request, where you will notice we not only are passing the `DistributionId`, but also the `ETag` we received when we created the distribution.

```bash
$ aws cloudfront update-distribution\
	--id E3OSJ4978QOTZ2\
	--distribution-config file://updated-distribution.json\
	--if-match E1Y4BASGKG03MO
{
    "ETag": "E2JUPVIBC3V15H",
    "Distribution": {
        "Id": "E3OSJ4978QOTZ2",
        "ARN": "arn:aws:cloudfront::9536171XXXXX:distribution/E3OSJ4978QOTZ2",
        "Status": "InProgress",
        "LastModifiedTime": "2023-04-07T02:26:50.622000+00:00",
        "InProgressInvalidationBatches": 0,
        "DomainName": "d1489et6zspdol.cloudfront.net",
...
```

To make sure the rule is applied we can check the access to the pages:

```bash
$ curl https://d1489et6zspdol.cloudfront.net
This is a public page
$ curl https://d1489et6zspdol.cloudfront.net/private.html
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<HTML><HEAD><META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=iso-8859-1">
<TITLE>ERROR: The request could not be satisfied</TITLE>
</HEAD><BODY>
<H1>403 ERROR</H1>
<H2>The request could not be satisfied.</H2>
<HR noshade size="1px">
Request blocked.
We can't connect to the server for this app or website at this time. There might be too much traffic or a configuration error. Try again later, or contact the app or website owner.
<BR clear="all">
If you provide content to customers through CloudFront, you can find steps to troubleshoot and help prevent this error by reviewing the CloudFront documentation.
<BR clear="all">
<HR noshade size="1px">
<PRE>
Generated by cloudfront (CloudFront)
Request ID: QGJDmdNqJJ6_zS3ALUczF-8NrM-HDKqTzNu-CZoppz6bi3nWv_cSIw==
</PRE>
<ADDRESS>
</ADDRESS>
</BODY></HTML>
```

## Strengthening the Environment

At this point, you will be right to notice that direct requests to `http://private.demo.secariolabs.com/private.html` would still be successful because in this case the WAF would not be applied. The traffic wouldn't be passing through it but directly to the server.

### Creating a Custom Lambda

To handle this, we can follow the recommendation from AWS and create our own Lambda function that pulls the latest list of IP addresses associated with CloudFront and updates the rules on the security group attached to our web server. In effect that would prevent unauthorized traffic and enforce a chain.

The Lambda will need to have the following `lambda_function.py` file:

```python
import os
import json
import boto3
import urllib.request
import hashlib


INGRESS_PORTS = [80]  # but may as well be [80, 443] or just [443]
VPC_ID = "vpc-032a791ded3139c0b"  # change me
SECURITYGROUP_ID = "sg-0de46ea030c72802c"  # change me
REGION = "eu-west-2"  # change me

ec2_client = boto3.client("ec2", region_name=REGION)
ec2_resource = boto3.resource("ec2", region_name=REGION)


def lambda_handler(event, context):
    # SNS message notification event when the ip ranges document is rotated
    message = json.loads(event["Records"][0]["Sns"]["Message"])
    response = urllib.request.urlopen(message["url"])
    ip_ranges = json.loads(response.read())

    cf_ranges = []
    for prefix in ip_ranges["prefixes"]:
        if prefix["service"] == "CLOUDFRONT":
            cf_ranges.append(prefix["ip_prefix"])

    rangeToUpdate = ec2_client.describe_security_groups(GroupIds=[SECURITYGROUP_ID])

    for sg in rangeToUpdate["SecurityGroups"]:

        sgo = ec2_resource.SecurityGroup(sg["GroupId"])
        if len(sgo.ip_permissions) > 0:
            sgo.revoke_ingress(IpPermissions=sgo.ip_permissions)

        for each_proto in INGRESS_PORTS:

            add_params = {
                "ToPort": int(each_proto),
                "FromPort": int(each_proto),
                "IpRanges": [{"CidrIp": range} for range in cf_ranges],
                "IpProtocol": "tcp",
            }

            ec2_client.authorize_security_group_ingress(
                GroupId=sg["GroupId"], IpPermissions=[add_params]
            )

```

But before we can go ahead and create the Lambda function, we will need to 1) create a policy with the necessary permissions, and 2) a role we can attach the policy to.

Starting with the IAM policy, we will need the following `lambdarole.json` file:

*Disclaimer: It is recommended to break down the policy into smaller statements and be specific about which resources it should apply to. This is a simple proof-of-concept.*

```javascript
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "CloudWatchPermissions",
    "Effect": "Allow",
    "Action": [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ],
    "Resource": "arn:aws:logs:*:*:*"
  }, {
    "Sid": "EC2Permissions",
    "Effect": "Allow",
    "Action": [
      "ec2:DescribeSecurityGroups",
      "ec2:AuthorizeSecurityGroupIngress",
      "ec2:RevokeSecurityGroupIngress",
      "ec2:DescribeVpcs",
      "ec2:ModifyNetworkInterfaceAttribute",
      "ec2:DescribeNetworkInterfaces"
    ],
    "Resource": "arn:aws:ec2:*:*:*"
  }]
}
```

The policy creation can be done with the following command:

```bash
$ aws iam create-policy\
	--policy-name LambdaPolicy\
	--policy-document file://lambdarole.json
{
    "Policy": {
        "PolicyName": "LambdaPolicy",
        "PolicyId": "ANPA54CACFZZNFOYOE5ZW",
        "Arn": "arn:aws:iam::9536171XXXXX:policy/LambdaPolicy",
...
```

Next, we will need to create a Lambda-based IAM role and then attach to it the policy we just created. For the role we will need the following `basepolicy.json` file:

```javascript
{
  "Version": "2012-10-17",
  "Statement": {
    "Effect": "Allow",
    "Principal": {
      "Service": "lambda.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
  }
}
```

The commands needed to create the role and attach the policy look as follows:

```bash
$ aws iam create-role\
	--role-name LambdaExecutionRole\
	--assume-role-policy-document  file://basepolicy.json
{
    "Role": {
        "Path": "/",
        "RoleName": "LambdaRole",
        "RoleId": "AROA54CACFZZMTBSYMFCL",
        "Arn": "arn:aws:iam::9536171XXXXX:role/LambdaRole",
...
$ aws iam attach-role-policy\
	--role-name LambdaRole\
	--policy-arn "arn:aws:iam::9536171XXXXX:policy/LambdaPolicy"
```

Finally, we can archive the Lambda function we wrote and upload it to AWS:

```bash
$ zip code.zip lambda_function.py
$ aws lambda create-function\
	--function-name UpdatingSGForCloudFront\
	--runtime python3.9\
	--zip-file fileb://code.zip\
	--handler lambda_function.lambda_handler\
	--role arn:aws:iam::9536171XXXXX:role/LambdaExecutionRole\
	--region eu-west-2
{
    "FunctionName": "UpdatingSGForCloudFront",
    "FunctionArn": "arn:aws:lambda:eu-west-2:9536171XXXXX:function:UpdatingSGForCloudFront",
...
```

### Testing the Lambda Function

Before we can test the Lambda function it is important to note that on average there are around 145-6 IP addresses associated with CloudFront, and because we will need to list each one of these IPs as a separate rule in the security group, we will hit the default quota on AWS for the number of *Inbound or outbound rules per security group*. So, it is important before we move forward to increase our quota with the following command:

```bash
$ aws service-quotas request-service-quota-increase\
    --service-code vpc\
    --quota-code L-0EA8095F\
    --desired-value 160
```

Keep in mind that the previous command could take an hour (or even more) to go into effect. But once ready, we can then use test input (file `lambdatestinput.json`) to run the command and see how it will behave. You will notice that this input appears to be an SNS event message, which is intentional. AWS has a public SNS topic that they use to notify whenever there is a change with the IP address association, so at the very end of our setup, we will subscribe to it, but before that, we will use it as test input:

```javascript
{
  "Records": [
    {
      "EventVersion": "1.0",
      "EventSubscriptionArn": "arn:aws:sns:EXAMPLE",
      "EventSource": "aws:sns",
      "Sns": {
        "SignatureVersion": "1",
        "Timestamp": "1970-01-01T00:00:00.000Z",
        "Signature": "EXAMPLE",
        "SigningCertUrl": "EXAMPLE",
        "MessageId": "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
        "Message": "{\"create-time\": \"yyyy-mm-ddThh:mm:ss+00:00\", \"synctoken\": \"0123456789\", \"md5\": \"7fd59f5c7f5cf643036cbd4443ad3e4b\", \"url\": \"https://ip-ranges.amazonaws.com/ip-ranges.json\"}",
        "Type": "Notification",
        "UnsubscribeUrl": "EXAMPLE",
        "TopicArn": "arn:aws:sns:EXAMPLE",
        "Subject": "TestInvoke"
      }
    }
  ]
}
```

To invoke the Lambda function with the test input we can use the following command:

```bash
$ aws lambda invoke\
	--function-name UpdatingSGForCloudFront\
	--payload fileb://lambdatestinput.json\
	outputfile.txt
{
    "StatusCode": 200,
    "ExecutedVersion": "$LATEST"
}
$ cat outputfile.txt
null
```

And to verify that indeed the rules have been created, we can check how many rules our security group now has:

```bash
$ aws ec2 describe-security-group-rules\
	--filter Name="group-id",Values="sg-0de46ea030c72802c" |\
	jq -r '.SecurityGroupRules | length'
146
```

The final check is to confirm that we can't reach the EC2 instance directly:

```bash
$ curl http://private.demo.secariolabs.com --connect-timeout 2
curl: (28) Failed to connect to private.demo.secariolabs.com port 80 after 2001 ms: Timeout was reached
```

### Subscribing to the Relevant SNS Topic

To ensure resilience and constant synchronization with the changes to the IP address space of CloudFront we can subscribe to the `AmazonIpSpaceChanged` public SNS topic and leave it alone.

```bash
$ aws sns subscribe\
	--topic-arn "arn:aws:sns:us-east-1:806199016981:AmazonIpSpaceChanged"\
	--region us-east-1\
	--protocol lambda\
	--notification-endpoint "arn:aws:lambda:eu-west-2:9536171XXXXX:function:UpdatingSGForCloudFront"
$ aws lambda add-permission\
	--function-name "arn:aws:lambda:eu-west-2:9536171XXXXX:function:UpdatingSGForCloudFront"\
	--statement-id lambda-sns-trigger\
	--region eu-west-2\
	--action lambda:InvokeFunction\
	--principal sns.amazonaws.com\
	--source-arn "arn:aws:sns:us-east-1:806199016981:AmazonIpSpaceChanged"
```

## Conclusion

In this article, we demonstrated how we can create a strict firewall that only allows traffic to an EC2 instance from CloudFront and would avoid the risk of an attacker discovering the web server's public IP address and reaching it directly. We also implemented an automated script that can immediately update the IP addresses in the firewall and keep them up to date.

By all means, the technique used in this blog could be applied in many different ways:

-   The IP address included in the SNS body (re: <https://ip-ranges.amazonaws.com/ip-ranges.json>) lists the IP addresses of all services in AWS and could also be useful in case you want to restrict access based on a different service, such as ELB, Lambda, etc.
-   The concept of hiding an EC2 instance behind an AWS service has many *offensive* use cases. For example, hiding phishing infrastructure or C2 infrastructure from being publicly exposed.

Hopefully, this article can help you better attack and defend systems behind CloudFront.

The article was written by [@saldat0](https://twitter.com/saldat0)