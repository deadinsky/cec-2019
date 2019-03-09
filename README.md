# cec-2019

###Background

This code was developed for the 2019 Canadian Engineering Competition, specifically the Programming category. Competitors this year were tasked with creating an artificial intelligence which controlled a specialized autonomous cleaner to clean a semi-formal eatery in an efficient manner. They clearly exemplified engineering principles, using collaborative solutions that focused on simplicity and ingenuity in addition to the overall performance. Dynamically calculating and crafting a solution to a simultaneous location and mapping problem is no easy feat, and all competitors showcased a unique solution that they should be proud of.

###How To Run

Navigate to this directory, then run `npm install` and then `node main.js` to start the code.

Use one of the tokens in order to interact with the program. More information can be found in the [competition package](https://github.com/deadinsky/cec-2019/blob/master/Programming%20Competition%20Package.pdf). Replace cec2019.ca with [localhost:8081](http://localhost:8081/) in your API calls.

If you would like to switch to the presentation phase version, change the first line to `var PRESENTATION_PHASE = true;`. Then go to [localhost:8081](http://localhost:8081/) in your web browser to see the visual representation.

Competitors at CEC 2019 completed this challenge without the use of a proper TOTAL_COUNT variable, relying on only their algorithms to make a good estimate as to whether or not they had cleaned the whole area. It has been fixed, but if you would like to disable it, change the second line to `var SHOW_TOTAL_COUNT = false;`.