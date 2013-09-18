Data Dashboard
==============

Comes in two flavors:

 * Demo - Static version with demo data from the 2012 deployment.
 * Live - User must authenticate with Ohmage to explore his data from a current survey.

Configuring
-----------

Dashboards must be configured for a certain dataset (i.e. campaign). This is done using the `config.json`. The repo has some examples of configuration files in the `config` directory. The config file is self-explanatory, take one of the examples and modify it to your needs and put it in the `config` dir.

Building 
--------

To compile, we need to install `npm` and the npm packages `jade`, `recess`, and `uglify-js`. For Ubuntu:

	sudo add-apt-repository ppa:chris-lea/node.js
	sudo apt-get update
	sudo apt-get install node
	sudo npm install -g jade recess uglify-js

Some build parameters can be configured by editing `Makefile`. By default the output dir is `/var/www`. 

Examples
--------

To build the included demo dashboards:

    make CAMPAIGN=snackdemo
    make CAMPAIGN=mediademo

To build the included live dashboards:

	make CAMPAIGN=snack
	make CAMPAIGN=media
	make CAMPAIGN=litter
	make CAMPAIGN=trash
	make CAMPAIGN=holiday
	make CAMPAIGN-algebra

That's it :-)




