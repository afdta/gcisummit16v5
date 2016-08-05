library("ggmap")
library("dplyr")
library("ggplot2")
library("tidyr")

#gci <- read.csv("~/Projects/Brookings/gci-summit-2016/data/all_data.csv", stringsAsFactors = FALSE, na.strings=c("","NA","na"))
#ll <- geocode(paste0(gci$metro,", ",gci$country), "latlona")
#gci2 <- cbind(ll, gci)
#saveRDS(gci2, file="~/Projects/Brookings/gci-summit-2016/data/all_data.RDS")

gci2 <- readRDS(file = "~/Projects/Brookings/gci-summit-2016/data/all_data.RDS")
vars <- read.csv(file = "~/Projects/Brookings/gci-summit-2016/data/varnames.csv", na.strings=c("na",""),row.names=NULL, stringsAsFactors=FALSE)

m <- reshape2::melt(gci2, id.vars=c("metro2","country", "label_cluster"), measure.vars=7:183)

#write.csv(data.frame(vars=unique(m$variable)), file="~/Projects/Brookings/gci-summit-2016/data/varnames.csv", row.names = FALSE)

#run summaries by variable and by variable crossed with label cluster

#function to add z-score
scaleChunk <- function(chunk){
  chunk$z <- scale(chunk$value)
  return(chunk)
}
mean_ <- function(chunk){return(mean(chunk, na.rm=TRUE))}
median_ <- function(chunk){return(median(chunk, na.rm=TRUE))}

zs <- m %>% group_by(variable) %>% do(scaleChunk(.))
meanz <- zs %>% group_by(variable, label_cluster) %>% summarise(mean=mean(z), mean2=mean_(z), median=median(z), median2=median_(z))

ggplot(zs, aes(x=z)) + geom_histogram() + facet_wrap(~variable)
ggplot(zs, aes(x=label_cluster, y=z)) + geom_point() + facet_wrap(~variable)
ggplot(zs, aes(x=variable, y=z)) + geom_point(colour="red", alpha="0.25") + geom_point(aes(x=variable, y=mean2), data=meanz) + facet_wrap(~label_cluster) + theme(axis.text.x = element_text(angle = 90, hjust = 1))
                                

ggmeans <- ggplot(meanz, aes(x=label_cluster, y=median2))
ggmeans + geom_bar(stat="identity") + facet_wrap(~variable, scales="fixed") + scale_x_continuous(breaks=1:7) + geom_text(aes(y=0, label=label_cluster), vjust=0, colour="#ffffff")
