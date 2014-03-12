## sudo add-apt-repository ppa:chris-lea/node.js
## sudo apt-get update
## sudo apt-get install node npm
## sudo npm install -g jade recess uglify-js

DATE=$(shell date +%I:%M%p)
CAMPAIGN=snack
OUT=/var/www/$(CAMPAIGN)

all: www 

www: clean
	
	#create output dir
	mkdir -p ${OUT}/css
	mkdir -p ${OUT}/data
		
	#copy config
	cp config/$(CAMPAIGN).json ${OUT}/config.json

	#compile html
	jade --pretty views --out ${OUT}
	
	#compile css
	recess --compile less/snack.less > ${OUT}/css/snack.css
	recess --compile less/login.less > ${OUT}/css/login.css
	recess --compile less/help.less > ${OUT}/css/help.css
	recess --compile less/choosecampaign.less > ${OUT}/css/choosecampaign.css
	
	#copy static files
	cp -rf lib ${OUT}/lib
	cp -rf source ${OUT}/js
	cp -rf images ${OUT}/images

	#compile javascript
	mkdir -p ${OUT}/js
	cd source; uglifyjs dashboard.js debug.js charts.js ohmage.js choropleth.js photopanel.js piechart.js barchart.js datechart.js hourchart.js wordcloud.js responsemodal.js filtercount.js dropdown.js help.js generalized.js editmodal.js -o ${OUT}/js/snack.min.js
	
	#demo data
	if [ -e "data/$(CAMPAIGN).csv" ]; then cp data/$(CAMPAIGN).csv ${OUT}/data/$(CAMPAIGN).csv; fi
	
clean:
	rm -rf ${OUT}
	rm -f ~/Desktop/$(CAMPAIGN).war

war : www
	mkdir -p ${OUT}/WEB-INF
	cp -f web.xml ${OUT}/WEB-INF
	cd ${OUT}; jar cvf ~/Desktop/$(CAMPAIGN).war *
	
deploy : demo
	scp ~/Desktop/*.war apollo.ohmage.org:~
	
.PHONY: clean
