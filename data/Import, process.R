library("ggmap")
library("dplyr")
library("ggplot2")
library("tidyr")
library("jsonlite")

#gci <- read.csv("~/Projects/Brookings/gci-summit-2016/data/cluster_indicators_alec_063016.csv", stringsAsFactors = FALSE, na.strings=c("","NA","na"), fileEncoding="latin1")
#ll <- geocode(paste0(gci$metro,", ",gci$country), "latlona")
#gci2 <- cbind(ll, gci)
#saveRDS(gci2, file="~/Projects/Brookings/gci-summit-2016/data/slimmed_version.RDS")

gci2 <- readRDS(file = "~/Projects/Brookings/gci-summit-2016/data/slimmed_version.RDS")
#vars <- read.csv(file = "~/Projects/Brookings/gci-summit-2016/data/varnames.csv", na.strings=c("na",""),row.names=NULL, stringsAsFactors=FALSE)

gci2$id <- paste0("m",1:nrow(gci2))

gci3 <- gci2[c(26, 25, 4, 5, 6, 1, 2, 7:24)]



#growth of fdi??
#keyvars <- gci2[c(4,6,1,2,7,9,13,21,22,24,25,26,27,28,148,149,155,157,158,)]

#gci2[1:10, c(148,150, 158)]

#m <- reshape2::melt(gci2, id.vars=c("metro2","country", "label_cluster"), measure.vars=7:183)

#write.csv(data.frame(vars=unique(m$variable)), file="~/Projects/Brookings/gci-summit-2016/data/varnames.csv", row.names = FALSE)

#run summaries by variable and by variable crossed with label cluster

#function to compute z score and return result as numeric -- summarise fails with scaled vectors -- presumably because they contain additional attributes... or the mean method dispatches differently...
scaleChunk <- function(chunk){
  return(as.numeric(scale(chunk)))
}
mean_ <- function(chunk){return(mean(chunk, na.rm=TRUE))}
median_ <- function(chunk){return(median(chunk, na.rm=TRUE))}

predicate <- function(x){return(is.numeric(x) & !is.integer(x))}
zs <- gci3[c(1,2,9:25)] %>% mutate_if(predicate, scaleChunk)
meanz <- zs[2:19] %>% group_by(label_cluster) %>% summarise_all(funs(mean(., na.rm=TRUE)))
meanz$id <- paste0("grpavg",meanz$label_cluster)
ns <- zs %>% group_by(label_cluster) %>% summarise(n())

minmax <- zs[3:19] %>% summarise_all(funs(max=max(., na.rm=TRUE), min=min(., na.rm=TRUE))) 
minmax <- meanz[2:18] %>% summarise_all(funs(max=max(., na.rm=TRUE), min=min(., na.rm=TRUE))) 
min(unlist(minmax))
max(unlist(minmax))


meanvals <- gci3[c(2,9:25)] %>% group_by(label_cluster) %>% summarise_all(funs(mean(., na.rm=TRUE)))

final <- list(vals=list(), z=list())
final$vals$metros <- gci3
final$vals$groups <- meanvals
final$z$metros <- zs
final$z$groups <- meanz

finalJ <- toJSON(final, digits=5)

writeLines(finalJ, con="~/Projects/Brookings/gci-summit-2016/data.json")


ggplot(zs, aes(x=z)) + geom_histogram() + facet_wrap(~variable)
ggplot(zs, aes(x=label_cluster, y=z)) + geom_point() + facet_wrap(~variable)
ggplot(zs, aes(x=variable, y=z)) + geom_point(colour="red", alpha="0.25") + geom_point(aes(x=variable, y=mean2), data=meanz) + facet_wrap(~label_cluster) + theme(axis.text.x = element_text(angle = 90, hjust = 1))
                                

ggmeans <- ggplot(meanz, aes(x=label_cluster, y=median2))
ggmeans + geom_bar(stat="identity") + facet_wrap(~variable, scales="fixed") + scale_x_continuous(breaks=1:7) + geom_text(aes(y=0, label=label_cluster), vjust=0, colour="#ffffff")


#We included 13 additional variables that measure one of the four quantitative dimensions of the
#competitiveness analysis framework used in this report. The variables included are: stock of Greenfield
#foreign direct investment (FDI) between 2009 and 2015 (traded clusters), stock of Greenfield FDI per
#capita between 2009 and 2015 (traded clusters), and total stock of jobs created by FDI between 2009 and
#2015 (traded clusters); number of highly cited papers between 2010 and 2013 (innovation), mean citation
#score between 2010 and 2013 (innovation), total patents between 2008 and 2012 (innovation), and total
#patents per capita between 2008 and 2012 (innovation); share of the population with tertiary education
#(talent) and share of the foreign-born population (talent); and number of aviation passengers in 2014
#(infrastructure), number of aviation passengers per capita in 2014 (infrastructure), and average internet
#download speed in 2014 (infrastructure).

df <- data.frame(cat=c(1,1,1,2,2,2,3,3,3), v1=c(1:8, na), v2=c(1:8, na), v3=c(1:8, na), v4=c(1:8, na))
df %>% group_by(cat) %>% summarise_all(funs(m1=mean(., na.rm=TRUE), m2=mean(., na.rm=TRUE), m3=mean(., na.rm=FALSE)))

