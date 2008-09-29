// For more info on triangular numbers see:
// http://en.wikipedia.org/wiki/Triangular_numbers
Math.tri = function( intInput )
{
	return ( intInput * ( intInput + 1 ) ) / 2
}
Math.trirt = function( intInput )
{
	return 0.5 * ( Math.sqrt( ( 8 * intInput ) + 1 ) - 1 );
}

// Compute a random color (within limits) using the HSB color space
var randomHsbColor = function()
{
	var arrValues = [];
	arrValues[0] = Math.floor(Math.random() * 360);
	arrValues[1] = Math.floor(Math.random() * 10) + 60;
	arrValues[2] = Math.floor(Math.random() * 10) + 60;
	return new Color(arrValues, 'hsb');
}

Element.implement( {
	
	// Traverse upwards through the dom to calculate the absolute font-size of
	// an element rather than the EM or percentage value.
	getFontSize: function()
	{
		var intFontMultiplier = 1;
		
		eleNode = this;
		
		do {
			strFontSize = eleNode.getStyle( 'fontSize' );
			intFontSize = strFontSize.toInt();
			
			if( strFontSize.match( /em$/ ) )
			{
				intFontMultiplier *= intFontSize;
			}
			else if( strFontSize.match( /\%$/ ) )
			{
				intFontMultiplier *= intFontSize * 0.01;
			}
			
			if( this.getParent() != $( document.body ) )
			{
				eleNode = eleNode.getParent();
				booTryAgain = true;
			}
			else
			{
				booTryAgain = false;
			}
		}
		while( ! strFontSize.match( /px$/ ) )
		
		return intFontSize * intFontMultiplier;
	}
	
} );

// MooZUI
//
// Description:
//   A zooming user interface toolkit built on the Mootools framework.
//
// Implements:
//   * Events
//   * Options
//
// Parts:
//   * MooZUI.Interface - Singleton methods for accessing ZUI elements
//   * MooZUI.Events - ZUI events
//   * MooZUI.HistoryManager - Implements Neil Jenkins' history manager
//   * MooZUI.Effects - Animations related to display of the ZUI
//   * MooZUI.RPC - Remote calls to server side scripts
//
var MooZUI = new Class( {

	Implements: [ Events, Options ],
	
	options: {
		targetElement: 'zui',
		startId: 1,
		depth: 3
	},
	
	buildHistoryManager: $empty,
	buildInterface: $empty,
	buildEffects: $empty,
	buildRPC: $empty,

	initialize: function( objOptions )
	{
		this.setOptions( objOptions );
		this.buildHistoryManager.bind( this )();
		this.buildInterface.bind(this)();
		this.buildEffects.bind( this )();
		this.buildRPC.bind( this )();
	},
	
} );

MooZUI.implement( {
	
	buildHistoryManager: function()
	{
		this.HistoryManager = new HistoryManager;
		// I would just merge these elements but Neil used goddamn singletons!
		this.HistoryManager.crumbTrail = [];
		this.HistoryManager.addCrumb = this.HistoryManagerAddons.addCrumb;
		this.HistoryManager.addEvent(
			'onHistoryChange',
			this.Effects.zoomOut.bind( this )
		);
	},
	
	HistoryManagerAddons: {
		
		addCrumb: function( eleNode )
		{
			var objNumerator = eleNode.getCoordinates();
			var objDenominator = this.Interface.links().getCoordinates();
			
			var intId = this.Interface.links().get('node');
			var arrColor = new Color( this.Interface.links().getStyle( 'backgroundColor' ) );
			
			var strPlacement = Math.round( ( objNumerator.left / objDenominator.width ) * 100 );
			strPlacement += 'x'+Math.round( ( objNumerator.top / objDenominator.height ) * 100 );
						
			var strSize = Math.round( ( objNumerator.width / objDenominator.width ) * 100 );
			strSize += 'x'+Math.round( ( objNumerator.height / objDenominator.height ) * 100 );
			
			var strFontSize = Math.round( eleNode.getFontSize() );
			
			var strHash = encodeURI( intId+'/'+arrColor.flatten()+'/'+strPlacement+'/'+strSize+'/'+strFontSize );
			
			if( strLastHash = this.HistoryManager.crumbTrail.getLast() )
			{
				if( strLastHash.split( '/' )[0] != intId )
				{
					this.HistoryManager.addState( strHash );
					this.HistoryManager.crumbTrail.push( this.HistoryManager.getCurrentLocation() );
				}
			}
			else if( this.HistoryManager.crumbTrail.length == 0 )
			{
				this.HistoryManager.addState( strHash );
				this.HistoryManager.crumbTrail.push( this.HistoryManager.getCurrentLocation() );
			}
		}
		
	}
	
} );

MooZUI.Interface = {
	
	zui: function()
	{
		return $( this.options.targetElement );
	},
	
	padding: function( strText )
	{
		return new Element(
			'div',
			{
				'class': 'padding'
			}
		).set( 'html', strText );
	},
	
	links: function()
	{
		if( $chk( $( 'zuiLinks' ) ) )
		{
			return $( 'zuiLinks' );
		}
		else
		{
			var strRandomColor = randomHsbColor();
			return new Element(
				'div',
				{
					'id': 'zuiLinks',
					'styles':
					{
						'backgroundColor': strRandomColor
					}
				}
			).injectInside( this.Interface.zui.bind(this)() );
		}	
	},
	
	content: function()
	{
		if( $chk( $( 'zuiContent' ) ) )
		{
			return $( 'zuiContent' );
		}
		else
		{
			return new Element(
				'div',
				{
					'id': 'zuiContent'
				}
			).injectInside( this.Interface.zui.bind(this)() );
		}
	},
	
	'nodes': function(eleTarget, arrLinks)
	{
		var intSlices = Math.ceil(Math.sqrt(arrLinks.length));
		var intSections = Math.pow(intSlices, 2);
		var objBaseStyles =
		{
			'width': Math.floor(100 / (intSlices + 1)) + '%',
			'height': Math.floor(100 / (intSlices + 1)) + '%',
			'position': 'absolute',
			'fontSize': Math.floor(100 / (intSlices + 1)) + '%'
		}
		var objBaseColor = new Color(eleTarget.getStyle('backgroundColor'));
		var arrColors =
		[
			new Color(
			[
				(objBaseColor.hsb[0] + 20) % 360,
				objBaseColor.hsb[1],
				(objBaseColor.hsb[2] > 50) ? objBaseColor.hsb[2] - 5 : objBaseColor.hsb[2] + 5
			], 'hsb'),
			new Color(
			[
				(objBaseColor.hsb[0] + 30) % 360,
				objBaseColor.hsb[1],
				(objBaseColor.hsb[2] > 50) ? objBaseColor.hsb[2] + 5: objBaseColor.hsb[2] - 5
			], 'hsb')
		];
		var intEmptiesStack = intSections - arrLinks.length;
		var intEmptiesBase = Math.ceil(Math.trirt(intEmptiesStack));
		var intExtraEmpties = intEmptiesStack - Math.tri(intEmptiesBase - 1);
		var intNodeCount = 0;
		var intCount = 0;
		while(intCount < intSections)
		{
			objPosition =
			{
				'x': (intCount % intSlices) + 1,
				'y': Math.floor(intCount / intSlices) + 1
			};
			
			var intPositionSum = objPosition.x + objPosition.y;
			
			if(intPositionSum > intEmptiesBase || intEmptiesStack == 0)
			{
				if(intPositionSum == intEmptiesBase + 1 && intExtraEmpties > 0)
				{
					intExtraEmpties--;
				}
				else
				{
					var objData = arrLinks.shift();
					
					var objNodeStyles =
					{
						'right': objBaseStyles.width.toInt() * (intSlices - objPosition.x) + '%',
						'bottom': objBaseStyles.height.toInt() * (intSlices - objPosition.y) + '%',
						'backgroundColor': (intPositionSum % 2 == 0) ? arrColors[0] : arrColors[1]
					};
					
					var objOptions = { 'styles': $merge(objBaseStyles, objNodeStyles) };
					var eleNode = new Element('div', objOptions);
					eleNode.set('node', objData.id);
					var objColor = new Color(eleNode.getStyle('backgroundColor'));
					
					eleNode.addEvents({
						'mouseenter': function(eleNode)
						{
							this.zoomTarget = eleNode;
						}.bind(this, eleNode),
						'click': function(eleNode)
						{
							this.HistoryManager.addCrumb.bind(this, eleNode)();
							this.Effects.zoomIn.bind(this, [eleNode])();
							return false;
						}.bind(this, eleNode)
					});
					
					eleTarget.adopt(eleNode)
					eleNode.adopt(this.Interface.padding(objData.title));
					
					if(objData.links) { this.Interface.nodes.pass([eleNode, objData.links], this)(); }
				}
			}
			else
			{
				intEmptiesStack--;
			}
			intCount++;
		}
		
		if(eleTarget == this.Interface.links())
		{
			this.Interface.links().removeEvents( 'click' );
			if(this.HistoryManager.crumbTrail.length > 0)
			{
				this.Interface.links().addEvent(
					'click',
					function()
					{
						history.go( -1 );
					}
				);
			}
			this.fireEvent('onFinishedDrawing');
		}
	}
	
};

MooZUI.implement( {
	
	Interface: MooZUI.Interface,
	
	buildInterface: function()
	{
		this.Interface.zui.bind( this )();
		this.Interface.links.bind( this )();
		this.Interface.content.bind( this )();
	}

} );

MooZUI.Effects = {
	
	'zoomIn': function( eleNode )
	{
		var objStartPosition = eleNode.getCoordinates();
		objStartPosition.fontSize = eleNode.getFontSize();
		
		var objEndPosition = this.Interface.links().getCoordinates();
		objEndPosition.fontSize = this.Interface.links().getStyle( 'fontSize' );
		
		var eleClonedNode = eleNode.clone( true );
		eleNode.destroy();
		
		eleClonedNode = eleClonedNode.setStyles( objStartPosition );
		this.Interface.links().adopt( eleClonedNode );
		
		var objFx = new Fx.Morph(
			eleClonedNode,
			{
				'duration': 500,
				'onComplete': function()
				{
					this.Interface.links().setStyle(
						'backgroundColor',
						eleClonedNode.getStyle( 'backgroundColor' )
					);
					
					this.RPC.getContent.pass( eleNode.get( 'node' ), this)();
				}.bind(this)
			}
		);
		
		objFx.start( objEndPosition );
	},
	
	'zoomOut': function()
	{

		var arrHistoryArgs = this.HistoryManager.crumbTrail.pop().split('/')
		var strId = arrHistoryArgs[0];
		var arrHSB = arrHistoryArgs[1].split(',');
		var arrColor = new Color( [ arrHSB[0].toInt(), arrHSB[1].toInt(), arrHSB[2].toInt() ] );
		var arrPlacement = arrHistoryArgs[2].split('x');
		var arrSize = arrHistoryArgs[3].split('x');
		var intFontSize = arrHistoryArgs[4];

		var objOriginalStyles = this.Interface.links().getCoordinates();
		
		var objStartStyles = $merge(
			objOriginalStyles,
			{
				'backgroundColor': this.Interface.links().getStyle( 'backgroundColor' ),
				'position': 'absolute',
				'fontSize': this.Interface.links().getStyle( 'fontSize' )
			}
		);
		
		var objEndStyles = {
			'width': Math.round( objStartStyles.width * ( arrSize[0] / 100 ) ),
			'height': Math.round( objStartStyles.height * ( arrSize[1] / 100 ) ),
			'left': Math.round( objStartStyles.width * ( arrPlacement[0] / 100 ) ),
			'top': Math.round( objStartStyles.height * ( arrPlacement[1] / 100 ) ),
			'fontSize': intFontSize
		}
		
		var eleZoom = new Element(
			'div',
			{
				'styles': objStartStyles
			}
		);
		
		eleZoom.set(
			'html',
			this.Interface.links().innerHTML
		);
		eleZoom.inject( this.Interface.zui.bind( this )() );
		
		var objFx = new Fx.Morph(
			eleZoom,
			{
				'duration': 500,
				'onComplete': function()
				{
					this.element.dispose();
				}
			}
		);
		
		this.addEvent(
			'onFinishedDrawing',
			function()
			{
				objFx.start( objEndStyles ); 	
			}.bind( this )
		);
		
		// clear the div
		this.Interface.links().set('html');
		this.Interface.links().setStyle('backgroundColor', arrColor);
		
		// get nodes
		this.RPC.getContent.bind(this, strId)();
	}
	
};

MooZUI.implement( {
	
	Effects: MooZUI.Effects
	
} );

MooZUI.RPC = {
	
	getContent: function( intId )
	{
		this.Interface.links().removeEvents( 'click' );
	
		var objOptions =
		{
			'url': 'node/request',
			'method': 'post',
			'data':
			{
				'id': intId,
				'depth': this.options.depth
			},
			'onComplete': function(objJson)
			{	
				this.Interface.links().empty().adopt( this.Interface.padding( objJson.title ) );
				this.Interface.content().empty().adopt( this.Interface.padding( objJson.content ) );
				this.Interface.links().set( 'node', objJson.id );
			
				if( objJson.links ) this.Interface.nodes.pass( [ this.Interface.links(), objJson.links ], this )();
				if( this.panelOpen ) this.effects.slideOut.bind( this )();
			}.bind(this)
		};
		var objJsonRequest = new Request.JSON( objOptions ).send();
	}
	
};

MooZUI.implement( {
	
	RPC: MooZUI.RPC,
	
	buildRPC: function()
	{
		this.RPC.getContent.bind( this, this.options.startId )();
	}
	
} );

var objZUI;

window.addEvent(
	'domready',
	function()
	{
		objZUI = new MooZUI();
	}
);