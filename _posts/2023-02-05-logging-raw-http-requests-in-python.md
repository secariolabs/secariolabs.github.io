---
title: "Logging Raw HTTP Requests in Python"
date: "2023-02-05T19:50:55+00:00"
bg_image: "/assets/images/posts/data-center-with-server-racks-2022-07-26-17-02-57-utc-1200x470.jpg"
author:
    name: "@saldat0"
    url: "https://x.com/saldat0"
---
Quite often, during our red team engagements, we find ourselves in a situation where we need to carry out web research & exploitation over several chained proxies. To that extended, to be able to do any reasonable web testing we need to be able to see the requests we send to the server and the corresponding replies. Tools like **BurpSuite** and **mitmproxy** can be helpful, however, by themselves, they introduce a lot of additional complexity, traffic overhead, and they are not very easy to configure in terms of what and how it is being logged. Sometimes you just want to have control over the data and do something with it. Because of that, our weapon of choice for most of these edge cases is **Python** with **ProxyChains**. The reason we like **Python** is because it is easy to enable HTTP request/response logging with the minimal amount of code.

The few techniques we are going to mention below could be used both for new scripts that you have built for a particular action, as well as if you want to modify an existing **Python** tool to have this additional, granular logging.

## Request Patching

By far the simplest fix to enable logging is to overwrite the `http.client.HTTPConnection.send` function, like the example below:

```python
import http
import requests

def patch_send():
    old_send = http.client.HTTPConnection.send
    def new_send(self, data):
        print(f'{"-"*9} BEGIN REQUEST {"-"*9}')
        print(data.decode('utf-8').strip())
        print(f'{"-"*10} END REQUEST {"-"*10}')
        return old_send(self, data)
    http.client.HTTPConnection.send = new_send

patch_send()

requests.get("http://secariolabs.com")
```

Once you do that, you will have full visibility over the requests in their final form, as show next:

{: .no-stripes}
```bash
--------- BEGIN REQUEST ---------
GET / HTTP/1.1
Host: secariolabs.com
User-Agent: python-requests/2.27.0
Accept-Encoding: gzip, deflate
Accept: */*
Connection: keep-alive
---------- END REQUEST ----------
--------- BEGIN REQUEST ---------
GET / HTTP/1.1
Host: secariolabs.com
User-Agent: python-requests/2.27.0
Accept-Encoding: gzip, deflate
Accept: */*
Connection: keep-alive
---------- END REQUEST ----------
```

Even though this technique is easy to implement and efficient, it is limited in that it can only log requests. To do the same action for responses, the process is a lot more primitive: in that case you need to hook the socket and just read any connections received by the client system, which wouldn't work if you have any other service being used on the host or if you decide to use multithreading. The moment things get asynchronous or if there is any noise, this technique wouldn't be able to accurately map a request to a response.

## Verbose Logging

One of the most popular and well documented techniques for implementing an additional logging could be enabled by setting `http.client.HTTPConnection.debuglevel` to **1**. Once you do that, you just need to create a logger and set the level to `DEBUG`, and you will be able to see the requests and responses.

An example configuration looks as follows:

```python
import http
import logging
import requests

http.client.HTTPConnection.debuglevel = 1

logging.basicConfig()
logging.getLogger().setLevel(logging.DEBUG)
requests_log = logging.getLogger("requests.packages.urllib3")
requests_log.setLevel(logging.DEBUG)
requests_log.propagate = True

requests.get('http://secariolabs.com')
```

The output of the above script is included below:

{: .no-stripes}
```bash
DEBUG:urllib3.connectionpool:Starting new HTTP connection (1): secariolabs.com:80
send: b'GET / HTTP/1.1\r\nHost: secariolabs.com\r\nUser-Agent: python-requests/2.27.0\r\nAccept-Encoding: gzip, deflate\r\nAccept: */*\r\nConnection: keep-alive\r\n\r\n'
reply: 'HTTP/1.1 301 Moved Permanently\r\n'
header: Server: CloudFront
header: Date: Wed, 15 Jun 2022 23:24:14 GMT
header: Content-Type: text/html
header: Content-Length: 183
header: Connection: keep-alive
header: Location: https://secariolabs.com/
header: X-XSS-Protection: 1; mode=block
header: X-Frame-Options: SAMEORIGIN
header: Referrer-Policy: strict-origin-when-cross-origin
header: X-Content-Type-Options: nosniff
header: X-Cache: Redirect from cloudfront
header: Via: 1.1 af69af45a94f94ec264bfb9a5a28f3aa.cloudfront.net (CloudFront)
header: X-Amz-Cf-Pop: LHR50-P1
header: X-Amz-Cf-Id: h_JponMfq0LCm1DtsCG0gJ1b5i0sYwLTfSA4fBlGI4bG_MDvMklgSg==
DEBUG:urllib3.connectionpool:http://secariolabs.com:80 "GET / HTTP/1.1" 301 183
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): secariolabs.com:443
send: b'GET / HTTP/1.1\r\nHost: secariolabs.com\r\nUser-Agent: python-requests/2.27.0\r\nAccept-Encoding: gzip, deflate\r\nAccept: */*\r\nConnection: keep-alive\r\n\r\n'
reply: 'HTTP/1.1 200 OK\r\n'
header: Content-Type: text/html; charset=UTF-8
header: Content-Length: 16347
header: Connection: keep-alive
header: Date: Wed, 15 Jun 2022 23:24:14 GMT
header: Server: Apache
header: Expires: Thu, 16 Jun 2022 00:24:14 GMT
header: Pragma: public
header: Cache-Control: max-age=3600, public
header: X-Frame-Options: SAMEORIGIN
header: Strict-Transport-Security: max-age=63072000
header: X-Mod-Pagespeed: 1.13.35.2-0
header: Content-Encoding: gzip
header: X-Frame-Options: SAMEORIGIN
header: X-Content-Type-Options: nosniff
header: Referrer-Policy: no-referrer-when-downgrade
header: X-Permitted-Cross-Domain-Policies: none
header: Feature-Policy: camera 'none'; fullscreen 'self'; geolocation *; microphone 'none'
header: Permissions-Policy: geolocation=(*), microphone=(), camera=(), fullscreen=(self)
header: Cache-Control: max-age=0, no-cache, s-maxage=10
header: Vary: Accept-Encoding
header: X-XSS-Protection: 1; mode=block
header: X-Cache: Miss from cloudfront
header: Via: 1.1 c58391b07051938ceda6615614fbabb0.cloudfront.net (CloudFront)
header: X-Amz-Cf-Pop: LHR50-P1
header: X-Amz-Cf-Id: XwcrYUnvx9ixV7iIeo0BW5gxCsTyvnDAnR79S4P_vG6nJUF6V-LdNg==
DEBUG:urllib3.connectionpool:https://secariolabs.com:443 "GET / HTTP/1.1" 200 16347
```

Even though this technique has many limitations, for the most part it could be considered sufficient if someone is just looking to collect full body requests and only response headers (notice there is no response body).

In principle, we don't fine this technique sufficient, and because of that we actually use an "extended" version of it, where we add an additional hook which has visibility over the data and we can manipulate it as we best see fit.

```python
import http
import logging
import requests


def httpclient_log(*args):
    print(args)
    # logging.getLogger('requests.packages.urllib3').log(logging.DEBUG, " ".join(args))


http.client.HTTPConnection.debuglevel = 1

logging.basicConfig()
logging.getLogger().setLevel(logging.DEBUG)
requests_log = logging.getLogger("requests.packages.urllib3")
requests_log.setLevel(0)
requests_log.propagate = True

http.client.print = httpclient_log

requests.get('http://secariolabs.com')
```

While the output from the above script appears very similar, notice the presence of brackets around each line indicating that the data is stored as a tuple and we can manipulate and use it as we wish:

{: .no-stripes}
```bash
DEBUG:urllib3.connectionpool:Starting new HTTP connection (1): secariolabs.com:80
('send:', "b'GET / HTTP/1.1\\r\\nHost: secariolabs.com\\r\\nUser-Agent: python-requests/2.27.0\\r\\nAccept-Encoding: gzip, deflate\\r\\nAccept: */*\\r\\nConnection: keep-alive\\r\\n\\r\\n'")
('reply:', "'HTTP/1.1 301 Moved Permanently\\r\\n'")
('header:', 'Server:', 'CloudFront')
('header:', 'Date:', 'Wed, 15 Jun 2022 23:26:56 GMT')
('header:', 'Content-Type:', 'text/html')
('header:', 'Content-Length:', '183')
('header:', 'Connection:', 'keep-alive')
('header:', 'Location:', 'https://secariolabs.com/')
('header:', 'X-XSS-Protection:', '1; mode=block')
('header:', 'X-Frame-Options:', 'SAMEORIGIN')
('header:', 'Referrer-Policy:', 'strict-origin-when-cross-origin')
('header:', 'X-Content-Type-Options:', 'nosniff')
('header:', 'X-Cache:', 'Redirect from cloudfront')
('header:', 'Via:', '1.1 36ca971f60479f380bc64504d2bb0680.cloudfront.net (CloudFront)')
('header:', 'X-Amz-Cf-Pop:', 'LHR52-C1')
('header:', 'X-Amz-Cf-Id:', 'ZBgLWkjU4pO-hrurXn3Qfz-9pMpZ_0SFbIAhLomz3O6GYvu2KlClbQ==')
DEBUG:urllib3.connectionpool:http://secariolabs.com:80 "GET / HTTP/1.1" 301 183
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): secariolabs.com:443
('send:', "b'GET / HTTP/1.1\\r\\nHost: secariolabs.com\\r\\nUser-Agent: python-requests/2.27.0\\r\\nAccept-Encoding: gzip, deflate\\r\\nAccept: */*\\r\\nConnection: keep-alive\\r\\n\\r\\n'")
('reply:', "'HTTP/1.1 200 OK\\r\\n'")
('header:', 'Content-Type:', 'text/html; charset=UTF-8')
('header:', 'Content-Length:', '16347')
('header:', 'Connection:', 'keep-alive')
('header:', 'Date:', 'Wed, 15 Jun 2022 23:26:57 GMT')
('header:', 'Server:', 'Apache')
('header:', 'Expires:', 'Thu, 16 Jun 2022 00:26:57 GMT')
('header:', 'Pragma:', 'public')
('header:', 'Cache-Control:', 'max-age=3600, public')
('header:', 'X-Frame-Options:', 'SAMEORIGIN')
('header:', 'Strict-Transport-Security:', 'max-age=63072000')
('header:', 'X-Mod-Pagespeed:', '1.13.35.2-0')
('header:', 'Content-Encoding:', 'gzip')
('header:', 'X-Frame-Options:', 'SAMEORIGIN')
('header:', 'X-Content-Type-Options:', 'nosniff')
('header:', 'Referrer-Policy:', 'no-referrer-when-downgrade')
('header:', 'X-Permitted-Cross-Domain-Policies:', 'none')
('header:', 'Feature-Policy:', "camera 'none'; fullscreen 'self'; geolocation *; microphone 'none'")
('header:', 'Permissions-Policy:', 'geolocation=(*), microphone=(), camera=(), fullscreen=(self)')
('header:', 'Cache-Control:', 'max-age=0, no-cache, s-maxage=10')
('header:', 'Vary:', 'Accept-Encoding')
('header:', 'X-XSS-Protection:', '1; mode=block')
('header:', 'X-Cache:', 'Miss from cloudfront')
('header:', 'Via:', '1.1 106f0cae03bb6a218d16ab28ba07c664.cloudfront.net (CloudFront)')
('header:', 'X-Amz-Cf-Pop:', 'LHR52-C1')
('header:', 'X-Amz-Cf-Id:', 'nGBi-YV_ni1oJGKFbkZo8ImTfVRLCEc2rQRJMi_y_HPj2cNg6OlY9A==')
DEBUG:urllib3.connectionpool:https://secariolabs.com:443 "GET / HTTP/1.1" 200 16347
```

Again, this technique comes with the limitation that multiprocessing can create a havoc when trying to match a request with response as they are not directly tied. The data is being printed as it is read on the socket, and not in batches; because of that each HTTP header is printed separately, rather than the whole HTTP packet being a single object.

## Round-trip Hook

Finally, the most comprehensive -- but also involving -- technique of doing detailed logging is to use request "hooks". In essence they allow (either per session or per individual request) to set a hook for a particular action which will be invoked by the `requests` module when the action is triggered.

In the example below it could be seen how we are setting a hook for the "response" action and we are providing a function. Once a request is made with a response incoming, the function would be triggered and the request and response will be passed to the function as arguments. With this technique it is possible to confidently know the mapping of request & response.

```python
import logging
import requests
import textwrap

class HttpFormatter(logging.Formatter):   

    def _formatHeaders(self, d):
        return '\n'.join(f'{k}: {v}' for k, v in d.items())

    def formatMessage(self, record):
        result = super().formatMessage(record)
        if record.name == 'httplogger':
            result += textwrap.dedent('''
                ---------------- request ----------------
                {req.method} {req.url}
                {reqhdrs}

                {req.body}
                ---------------- response ----------------
                {res.status_code} {res.reason} {res.url}
                {reshdrs}

                {res.text}
            ''').format(
                req=record.req,
                res=record.res,
                reqhdrs=self._formatHeaders(record.req.headers),
                reshdrs=self._formatHeaders(record.res.headers),
            )

        return result

formatter = HttpFormatter('{asctime} {levelname} {name} {message}', style='{')
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logging.basicConfig(level=logging.DEBUG, handlers=[handler])

logger = logging.getLogger('httplogger')

def logRoundtrip(response, *args, **kwargs):
    extra = {'req': response.request, 'res': response}
    logger.debug('HTTP roundtrip', extra=extra)

session = requests.Session()
session.hooks['response'].append(logRoundtrip)

session.get('http://secariolabs.com')
```

The output of the above command looks as follows:

{: .no-stripes}
```bash
2022-06-16 00:31:43,991 DEBUG urllib3.connectionpool Starting new HTTP connection (1): secariolabs.com:80
2022-06-16 00:31:44,042 DEBUG urllib3.connectionpool http://secariolabs.com:80 "GET / HTTP/1.1" 301 183
2022-06-16 00:31:44,043 DEBUG httplogger HTTP roundtrip
---------------- request ----------------
GET http://secariolabs.com/
User-Agent: python-requests/2.27.0
Accept-Encoding: gzip, deflate
Accept: */*
Connection: keep-alive

None
---------------- response ----------------
301 Moved Permanently http://secariolabs.com/
Server: CloudFront
Date: Wed, 15 Jun 2022 23:31:46 GMT
Content-Type: text/html
Content-Length: 183
Connection: keep-alive
Location: https://secariolabs.com/
X-XSS-Protection: 1; mode=block
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Cache: Redirect from cloudfront
Via: 1.1 2fafb26bfb5e0420de152a7abef27a44.cloudfront.net (CloudFront)
X-Amz-Cf-Pop: LHR52-C1
X-Amz-Cf-Id: 5WSuiFqiDF_me87HjfB02e4XSkp8ZMWTauHSvVQawC9Hg51bjH9K-Q==

<html>
<head><title>301 Moved Permanently</title></head>
<body bgcolor="white">
<center><h1>301 Moved Permanently</h1></center>
<hr><center>CloudFront</center>
</body>
</html>

2022-06-16 00:31:44,047 DEBUG urllib3.connectionpool Starting new HTTPS connection (1): secariolabs.com:443
2022-06-16 00:31:44,132 DEBUG urllib3.connectionpool https://secariolabs.com:443 "GET / HTTP/1.1" 200 16347
2022-06-16 00:31:44,133 DEBUG httplogger HTTP roundtrip
---------------- request ----------------
GET https://secariolabs.com/
User-Agent: python-requests/2.27.0
Accept-Encoding: gzip, deflate
Accept: */*
Connection: keep-alive

None
---------------- response ----------------
200 OK https://secariolabs.com/
Content-Type: text/html; charset=UTF-8
Content-Length: 16347
Connection: keep-alive
Date: Wed, 15 Jun 2022 23:31:46 GMT
Server: Apache
Expires: Thu, 16 Jun 2022 00:31:46 GMT
Pragma: public
Cache-Control: max-age=3600, public, max-age=0, no-cache, s-maxage=10
X-Frame-Options: SAMEORIGIN, SAMEORIGIN
Strict-Transport-Security: max-age=63072000
X-Mod-Pagespeed: 1.13.35.2-0
Content-Encoding: gzip
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer-when-downgrade
X-Permitted-Cross-Domain-Policies: none
Feature-Policy: camera 'none'; fullscreen 'self'; geolocation *; microphone 'none'
Permissions-Policy: geolocation=(*), microphone=(), camera=(), fullscreen=(self)
Vary: Accept-Encoding
X-XSS-Protection: 1; mode=block
X-Cache: Miss from cloudfront
Via: 1.1 44a651f8e3a1f38a5a977c4f0c4d45a0.cloudfront.net (CloudFront)
X-Amz-Cf-Pop: LHR52-C1
X-Amz-Cf-Id: 7eReUC-yuJugzYBRCVoKauftHc53DvdsKi1hx1pU5M9TjJc_Ml6n9Q==

<!DOCTYPE html>
[...snip...]
```

This concludes our quick look into HTTP logging using Python.

Future research could focus on websocket logging (something we are starting to see more of), as well as a way to add a default hook to `requests`, rather than having to set one per session and then having to manually track that all session objects have this hook.
