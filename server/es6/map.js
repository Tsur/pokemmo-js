"use strict";

import R from 'ramda';
import * as Util from './util.js';
import * as Const from './const.js';

export default class GameMap {

    constructor(id){

        this.id = id;

        this.data = Util.loadFile(`${__dirname}/../resources/maps/${id}.json`, 'utf8');

        this.warps= new Map();
        this.instances = new Map();
        this.points = new Map();
        this.encounterAreas = [];

        //this.playersPerInstance = !this.data.properties.players_per_instance ?
        //    0 : parseInt(this.data.properties.players_per_instance);
        //
        //this.grassEncounters = this.data.properties.grass_encounters;

        const tileLayers = R.filter(layer => layer.type == Const.LAYER_TILELAYER, this.data.layers);
        const objectLayers = R.filter(layer => layer.type == Const.LAYER_OBJECTGROUP, this.data.layers);

        for(let layer of tileLayers){

            if (!layer.properties || layer.properties.data_layer != '1') continue;

            let j = 0;

            this.solidData = Util.initMatrix(Const.SD_NONE, this.data.width, this.data.height);

            for(let y of R.range(0, this.data.height)){

                for(let x of R.range(0, this.data.width)){

                    const tileid = layer.data[++j];

                    const curTilesetTileid = getTileProperties(this.getTilesetOfTile(tileid), tileid);

                    if(curTilesetTileid) this.solidData[x][y] = getSolidData(curTilesetTileid);

                }
            }
        }

        for(let layer of objectLayers){

            for(let obj of layer.objects){

                const [x1, y1, x2, y2] = getObjectCoords(obj, this.data.tilewidth, this.data.tileheight);

                this.classifyObject(obj, x1, y1, x2, y2);

            }
        }

    }

    classifyObject(obj, x1, y1, x2, y2){

        switch(obj.type){
            case 'tall_grass':
                this.encounterAreas.push({ x1:x1, y1:y1, x2:x2, y2:y2, encounters: obj.properties.encounters });
                break;
            case 'warp':
                this.warps.set(obj.name, {x: x1, y:y1, type: obj.properties.type, destination: obj.properties.destination});
                break;
            case 'point':
                this.points.set(obj.name, {mapName: this.id, x: x1, y: y1, direction: !obj.properties.direction ? Const.DIR_DOWN : obj.properties.direction});
                break;
            default: break;
        }
    }

    getEncounterAreasAt(x, y) {

        return R.filter(area => x >= area.x1 && y >= area.y1 && x < area.x2 && y < area.y2, this.encounterAreas);
    }

    createInstance() {

        const id = Util.uuid();

        const instance = new MapInstance(this, id);

        this.instances.set(id, instance);

        return instance;
    }

    getTilesetOfTile(n) {

        if(!n) return;

        let i = R.length(this.data.tilesets);

        while (i-- > 0) if (n >= this.data.tilesets[i].firstgid) return this.data.tilesets[i];
    }

    getWarps(name){

        return this.warps.get(name);
    }

}

function getObjectCoords(obj, tilewidth, tileheight){

    const x1 = Math.round(obj.x / tilewidth);
    const y1 = Math.round(obj.y / tileheight);
    const x2 = Math.round((obj.x + obj.width) / tilewidth);
    const y2 = Math.round((obj.y + obj.height) / tileheight);

    return [x1, y1, x2, y2];
}

function getSolidData(tile){

    if(tile.solid == '1') return Const.SD_SOLID;
    else if(tile.water == '1') return Const.SD_WATER;
    else if(tile.grass == '1') return Const.SD_GRASS;
    else if(tile.ledge == '1'){

        if(tile.ledge_dir == '1') return Const.SD_LEDGE_LEFT;
        else if(tile.ledge_dir == '2') return Const.SD_LEDGE_UP;
        else if(tile.ledge_dir == '3') return Const.SD_LEDGE_RIGHT;
        else return Const.SD_LEDGE_DOWN;

    }
}

function getTileProperties(tileset, tileid){

    if(!tileset || !tileid) return;

    return tileset.tileproperties[tileid - tileset.firstgid]
}