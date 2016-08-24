#!/usr/bin/env bash

../node_modules/.bin/topojson -o /home/alec/Projects/Brookings/gci-summit-2016/world.json \
-q 1e6 --filter none -p name -p formal_en --simplify-proportion 0.75 \
-- countries=/home/alec/Projects/Brookings/gci-summit-2016/data/ne_110m_admin_0_countries/ne_110m_admin_0_countries.shp

