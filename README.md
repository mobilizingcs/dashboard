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
	make CAMPAIGN=nutrition

Updating Demo Data
------------------

Below the steps to update the data of demo campaigns:

 1. Study the `snackdemo.json` and `mediademo.json` file, especially `photo.thumb` and `photo.img` properties. These must resolve to local or external locations of the pictures.
 2. Study the included `data/snackdemo.csv` and `data/mediademo.csv`, especially column names. Order of the columns is not important, but the exact name is.
 3. Export the campaign data in CSV format from Ohmage. Combine all data into a single dataset.
 4. Check that the column names are the same as in the current `snackdemo.csv` and `mediademo.csv`. Rename where necessary.
 5. Remove un-needed columns from the dataset.
 6. Clean up the data: remove all rows with uncomplete survey responses.
 7. Export all the icons and images from all photos in the dataset and put them on a web server somewhere.
 8. Update the `photo.thumb` and `photo.img` properties in the config file to point to the image server.
 9. (optional) add random values to the longitude and latitude columns for privacy.




