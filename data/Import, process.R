library("ggmap")
library("dplyr")
library("ggplot2")
library("jsonlite")
library("rgdal")

#core data
gci <- read.csv("~/Projects/Brookings/gci-summit-2016/data/data.csv", stringsAsFactors = FALSE, na.strings=c("","NA","na"), skip=1, header=FALSE)

#supplementary pop
pop <- read.csv("~/Projects/Brookings/gci-summit-2016/data/archive/cluster_indicators_alec_063016.csv", stringsAsFactors=FALSE, fileEncoding = "latin1")[c("metro","country","pop_2015")]
names(pop) <- c("V1", "V3", "V0")

gci <- merge(gci, pop, by=c("V1","V3"), all.x=TRUE)
V21 <- ifelse(gci$V21=="Knowledge Centers", "Knowledge Capitals", gci$V21)
gci[gci$V21!=V21, "V21"]
gci$V21 <- V21

#produce a variable map
nms <- read.csv("~/Projects/Brookings/gci-summit-2016/data/data.csv", stringsAsFactors = FALSE, na.strings=c("","NA","na"), nrows=1, header=FALSE)
formats <- c("id","id","id","rank","doll1","doll1","doll1","pct1",
             "pct1","pct1","num1","doll1", "doll1","sh1","num1",
             "doll1","sh1","num0","num0","id","id")

nms2 <- as.data.frame(cbind(t(nms),formats)) 
nms3 <- rbind(nms2, data.frame(V1=c("Longitude","Latitude","Population"), formats=c("num5","num5","num0"), row.names=c("V22","V23","V0")))
nms3$cat <- c(rep("id",4), 
              rep("Economic characteristics",3),
              rep("Economic growth",3),
              rep("Tradable clusters",3), 
              rep("Innovation",3),
              rep("Talent",1),
              rep("Connectivity",2), 
              rep("id",4),
              "Economic characteristics")
nms3$varid <- row.names(nms3)
nms3$short <- c("metro", "metro2", "country", "rank_300", "GDP", 
                "GDP per capita", "Productivity", "GDP growth, 2000–15", 
                "GDP per capita growth, 2000–15", "Productivity growth, 2000–15", 
                "Traded sector productivity", "FDI per capita", 
                "FDI", "Research citations", 
                "Patents per capita", "VC per capita", 
                "Higher ed. attainment", 
                "Air passengers", "Internet speed", "cluster", 
                "cluster name", "lon", "lat", "Population")
nms3$long <- c("metro", "metro2", "country", "rank_300", "Nominal GDP, 2015", 
  "Nominal GDP per capita, 2015", "Output per worker, 2015", "Annual average real GDP growth, 2000–2015", 
  "Annual average real GDP per capita growth, 2000–2015", "Annual average real output per worker growth, 2000–2015", 
  "Traded sector productivity differential, 2015", "Greenfield foreign direct investment per capita, 2009–2015", 
  "Greenfield foreign direct investment, 2009–2015", "Share of publications in the top 10 percent of cited papers, 2010–2013", 
  "Patents per capita, 2008–2012", "Venture capital investments per capita ($1000s), 2006–2015", 
  "Share of population with tertiary education, most recent year", 
  "Total aviation passengers, 2014", "Average internet download speed, 2015", "label_cluster", 
  "cluster name", "Longitude", "Latitude", "Population")

getNames <- function(varids){
  pos <- match(varids, nms3$varid)
  return(nms3[pos,"long"])
}

nmsplit <- split(nms3, nms3$varid)

varlist <- lapply(nmsplit, function(e){
  return(list(name=e$long, nameshort=e$short, format=e$formats, cat=e$cat, varid=e$varid))
})

#read in descriptions
clusters <- gci %>% group_by(V20,V21) %>% summarise(num=n())
clusters$description <- readLines("~/Projects/Brookings/gci-summit-2016/data/Cluster descriptions.txt")
names(clusters) <- c("cluster", "name", "num", "description")

json_vars <- toJSON(list(vars=varlist, clusters=clusters), auto_unbox=TRUE)

#writeLines(json, "/home/alec/Projects/Brookings/gci-summit-2016/data/vars.json")


gcisearch <- paste0(gci$V1, ", ", gci$V3)
gcisearch[which(gcisearch == "Rotterdam-Amsterdam, Netherlands")] <- "Amsterdam, Netherlands" 

ll1 <- geocode(gcisearch, "latlona")
ll <- ll1
names(ll) <- c("V22","V23","GeoSearch")

#ll2 <- geocode(paste0(gci$V2,", ",gci$V3), "latlona")
#names(ll1) <- paste0(names(ll1),"1")
#names(ll2) <- paste0(names(ll2),"2")
#ll <- cbind(gci[c("V1","V3")],ll1, ll2)
#ll$lond <- abs(ll$lon1-ll$lon2)
#ll$latd <- abs(ll$lat1-ll$lat2)
#llnm <- filter(ll, lond > 1 | latd > 1)

gci2 <- cbind(gci,ll)
#saveRDS(gci2, file="~/Projects/Brookings/gci-summit-2016/data/slimmed_version.RDS")

#gci2 <- readRDS(file = "~/Projects/Brookings/gci-summit-2016/data/slimmed_version.RDS")
#vars <- read.csv(file = "~/Projects/Brookings/gci-summit-2016/data/varnames.csv", na.strings=c("na",""),row.names=NULL, stringsAsFactors=FALSE)

gci2$id <- paste0("m",1:nrow(gci2))

#shape files
#world <- readOGR(dsn="/home/alec/Projects/Brookings/gci-summit-2016/data/ne_110m_admin_0_countries/", layer="ne_110m_admin_0_countries", stringsAsFactors=FALSE)
#writeOGR(world2, "/home/alec/Projects/Brookings/gci-summit-2016/", layer="", driver="GeoJSON")

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

predicate <- function(x){return(is.numeric(x) & !is.integer(x))}

zs <- gci2[c(1,3,5:20,22)] %>% mutate_if(predicate, scaleChunk)
sum(zs$V20 == gci2$V20)

meanz <- zs %>% group_by(V20) %>% summarise_all(funs(mean(., na.rm=TRUE)))
grpmeans <- gci2[c(5:20,22)] %>% group_by(V20) %>% summarise_all(funs(mean(., na.rm=TRUE)))
meanz_tst <- grpmeans
meanz_tst$z5 <- scale(meanz_tst$V5)

minmax <- zs[c(1:15,17)] %>% summarise_all(funs(max=max(., na.rm=TRUE), min=min(., na.rm=TRUE))) 
minmax <- meanz[2:17] %>% summarise_all(funs(max=max(., na.rm=TRUE), min=min(., na.rm=TRUE))) 
min(unlist(minmax))
max(unlist(minmax))

final <- list(vals=list(), z=list())
final$vals$metros <- gci2
final$vals$groups <- grpmeans
final$z$metros <- zs
final$z$groups <- meanz

finalJ <- toJSON(final, digits=5)

final <- c('{\n"meta":', json_vars, ',\n"data":', finalJ, '\n}\n')

writeLines(final, con="~/Projects/Brookings/gci-summit-2016/data.json", sep="")

jin <- readLines("~/Projects/Brookings/gci-summit-2016/data.json")

fromJ <- fromJSON(jin)
json_vars2 <- toJSON(fromJ$meta, auto_unbox=TRUE)
json_vars2==json_vars

finalJ2 <- toJSON(fromJ$data, digits=5)
finalJ==finalJ2

#testdf

GCI <- gci2
names(GCI) <- getNames(names(GCI))


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

