# Player AVPlay

This application demonstrates the usage of `webapis.avplay` API. With this API it is possible to have a video player in application. AVPlay is alternative to HTML5 player and has many advantages over it including: wider range of codecs and formats, DRMs support, hardware acceleration.
It is highly recommended for handling videos in SmartTV applications.


## How to use the Player AVPlay application

Use TV remote controller to navigate. By pressing on the buttons user can see the output from the methods of the `webapis.avplay` API.


## Supported platforms

2015 and newer


## Prerequisites

To use `webapis.avplay` API, embed below script into your `index.html`:

```html
<script src="$WEBAPIS/webapis/webapis.js"></script>
```

## Privileges and metadata

In order to use `webapis.avplay` API the following privilege must be included in `config.xml`:

```xml
<tizen:privilege name="http://developer.samsung.com/privilege/avplay" />
```

### File structure

```
PlayerAvplay/ - PlayerAvplay sample app root folder
│
├── assets/ - resources used by this app
│   │
│   ├── JosefinSans-Light.ttf - font used in application
│   └── RobotoMono-Regular.ttf - font used in application
│
├── css/ - styles used in the application
│   │
│   ├── main.css - styles specific for the application
│   └── style.css - style for application's template
│
├── js/ - scripts used in the application
│   │
│   ├── init.js - script that runs before any other for setup purpose
│   ├── keyhandler.js - module responsible for handling keydown events
│   ├── logger.js - module allowing user to register logger instances
│   ├── main.js - main application script
│   ├── navigation.js - module responsible for handling in-app focus and navigation
│   ├── utils.js - module with useful tools used through application
│   └── videoPlayer.js - module controlling AVPlay player
│
├── CHANGELOG.md - changes for each version of application
├── config.xml - application's configuration file
├── icon.png - application's icon
├── index.html - main document
└── README.md - this file
```

## Other resources

*  **AVPlay API**  
  https://developer.samsung.com/tv/develop/api-references/samsung-product-api-references/avplay-api

* **AVPlay guide**  
  https://developer.samsung.com/tv/develop/guides/multimedia/media-playback/using-avplay


## Copyright and License

**Copyright 2019 Samsung Electronics, Inc.**

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
