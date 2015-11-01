package pokemmo;

import js.html.CanvasRenderingContext2D;
import pokemmo.moves.MDefault;

/**
 * ...
 * @author Sonyp
 */

class Move {
	static public var list:Map<String, Move>;
	
	static private function createList():Void {
		list = new Map<Move>();
		
		list.set('def', new MDefault());
	}
	
	static public function getMove(n:String):Move {
		if (list == null) createList();
		if (!list.exists(n)) return list.get('def');
		return list.get(n);
	}
	
	public function new():Void {
		
	}
	
	public function start():Void {
		
	}
	
	public function render(ctx:CanvasRenderingContext2D, battle:Battle):Void {
		
	}
}