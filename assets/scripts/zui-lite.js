// This is a function to compute triangular numbers
//
// If you're not familiar with them take a look here
// http://en.wikipedia.org/wiki/Triangular_numbers
Math.tri = function(intInput)
{
	return (intInput * (intInput + 1)) / 2
}

// This is a function to compute triangular roots
Math.trirt = function(intInput)
{
	return 0.5 * (Math.sqrt((8 * intInput) + 1) - 1);
}

// Compute a random color (within limits) using the HSB color space
var funRandomHsbColor = function()
{
	var arrValues = [];
	arrValues[0] = Math.floor(Math.random() * 360);
	arrValues[1] = Math.floor(Math.random() * 10) + 60;
	arrValues[2] = Math.floor(Math.random() * 10) + 60;
	return new Color(arrValues, 'hsb');
}

var ZUI = new Class({
	
	'Implements': [Options, Events],
	
	'options':
	{
		'element': 'zui',
		'start': 1,
		'depth': 3
	},
	
	'zoomTarget': [],
	
	'initialize': function(objOptions)
	{
		this.setOptions(objOptions);

		this.historyManager = new HistoryManager();
		this.historyManager.addEvent(
			'onHistoryChange',
			this.effects.zoomOut.bind(this)
		);

		this.interface.zui.bind(this)();
		this.interface.content.bind(this)();
		this.interface.links.bind(this)();
		this.remote.getContent.bind(this, this.options.start)();
	},
	
	'breadcrumbs':
	{	
		'crumbTrail': [],
		
		'addCrumb': function(eleNode)
		{
			// numerator dimmensions
			var objNumerator = eleNode.getCoordinates();
			// denominator dimmensions
			var objDenominator = this.interface.links().getCoordinates();

			var strPlacement = Math.round((objNumerator.left / objDenominator.width) * 100)+'x'+Math.round((objNumerator.top / objDenominator.height) * 100);
			var strSize = Math.round((objNumerator.width / objDenominator.width) * 100)+'x'+Math.round((objNumerator.height / objDenominator.height) * 100);

			var arrColor = new Color(this.interface.links().getStyle('backgroundColor'));
			var intId = this.interface.links().get('node')
			var strHash = encodeURI(intId+'/'+arrColor.flatten()+'/'+strPlacement+'/'+strSize);
			
			if(strLastHash = this.breadcrumbs.crumbTrail.getLast())
			{
				if(strLastHash.split('/')[0] != intId)
				{
					this.historyManager.addState(strHash);
					this.breadcrumbs.crumbTrail.push(this.historyManager.getCurrentLocation());
				}
			}
			else if(this.breadcrumbs.crumbTrail.length == 0)
			{
				this.historyManager.addState(strHash);
				this.breadcrumbs.crumbTrail.push(this.historyManager.getCurrentLocation());
			}
		}
	},
	
	'interface':
	{
		'zui': function()
		{
			return $(this.options.element);
		},
		
		'padding': function(strText)
		{
			return new Element(
				'div',
				{
					'class': 'padding'
				}
			).set('html', strText);
		},
		
		'links': function()
		{
			if($chk($('zuiLinks')))
			{
				return $('zuiLinks');
			}
			else
			{
				var strRandomColor = funRandomHsbColor();
				
				var objOptions =
				{
					'id': 'zuiLinks',
					'styles':
					{
						'backgroundColor': strRandomColor
					}
				};

				return new Element('div', objOptions).injectInside(this.interface.zui.bind(this)());
				
				// change the color of links in the content window
				this.interface.content().setStyle('color', strRandomColor);
			}
				
		},
		
		// returns the content element or if it doesn't exist create it
		'content': function()
		{
			if($chk($('zuiContent')))
			{
				return $('zuiContent');
			}
			else
			{
				var objOptions = {
					'id': 'zuiContent'
				}
				return new Element('div', objOptions).injectInside(this.interface.zui.bind(this)());
			}
		},
		
		'nodes': function(eleTarget, arrLinks)
		{
			// get the number of horizontal / vertical divisions
			var intSlices = Math.ceil(Math.sqrt(arrLinks.length));
			
			// get the full number of sections
			var intSections = Math.pow(intSlices, 2);
			
			// get the base values for link CSS styles
			var objBaseStyles =
			{
				'width': Math.floor(100 / (intSlices + 1)) + '%',
				'height': Math.floor(100 / (intSlices + 1)) + '%',
				'position': 'absolute',
				'fontSize': Math.floor(100 / (intSlices + 1)) + '%'
			}
			
			// Get the color of the zui background for color mixing
			var objBaseColor = new Color(eleTarget.getStyle('backgroundColor'));
			
			// Get the 'dark' and 'light' values
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
			
			// get the number of empty cells
			var intEmptiesStack = intSections - arrLinks.length;
			
			// how many cells make the base of our empties pyramid?
			var intEmptiesBase = Math.ceil(Math.trirt(intEmptiesStack));
			
			// how many cells are empty that aren't in the empties pyramid?
			var intExtraEmpties = intEmptiesStack - Math.tri(intEmptiesBase - 1);
			
			var intNodeCount = 0;
			
			var intCount = 0;
			// Loop through all the cells in the
			while(intCount < intSections)
			{
				// get the x and y position of this node based off the count
				objPosition =
				{
					'x': (intCount % intSlices) + 1,
					'y': Math.floor(intCount / intSlices) + 1
				};
				
				// Add the X and Y values together
				var intPositionSum = objPosition.x + objPosition.y;
				
				// Decide whether we should attempt to draw a node
				if(intPositionSum > intEmptiesBase || intEmptiesStack == 0)
				{
					// Oops this node is actually empty (don't draw anything)
					if(intPositionSum == intEmptiesBase + 1 && intExtraEmpties > 0)
					{
						intExtraEmpties--;
					}
					// Draw the node!
					else
					{
						// Pop a node off the array to draw
						var objData = arrLinks.shift();
						
						// Get the rest of the CSS properties for this node
						objNodeStyles =
						{
							'right': objBaseStyles.width.toInt() * (intSlices - objPosition.x) + '%',
							'bottom': objBaseStyles.height.toInt() * (intSlices - objPosition.y) + '%',
							'backgroundColor': (intPositionSum % 2 == 0) ? arrColors[0] : arrColors[1]
						};
						
						// Merge the base styles and our node styles together
						var objOptions =
						{
							'styles': $merge(objBaseStyles, objNodeStyles)
						};
						
						// Create the node
						var eleNode = new Element('div', objOptions);
						
						// Attatch the id to the element
						eleNode.set('node', objData.id);

						// get the background color so we can pass it
						var objColor = new Color(eleNode.getStyle('backgroundColor'));
						
						// add the zoom and mouseenter events
						eleNode.addEvents({
							'mouseenter': function(eleNode)
							{
								this.zoomTarget = eleNode;
							}.bind(this, eleNode),
							'click': function(eleNode)
							{
								this.breadcrumbs.addCrumb.bind(this, eleNode)();
								
								// zoom this node
								this.effects.zoomIn.bind(this, [eleNode])();
								
								// This is important! It stops propagation of the click event
								return false;
							}.bind(this, eleNode)
						});
						
						eleTarget.adopt(eleNode)
						eleNode.adopt(this.interface.padding(objData.title));
						
						if(objData.links)
						{
							this.interface.nodes.pass([eleNode, objData.links], this)();
						}
					}
				}
				else
				{
					intEmptiesStack--;
				}
				intCount++;
			}
			
			if(eleTarget == this.interface.links()) this.fireEvent('onFinishedDrawing');
		}
				
	},
	
	'effects':
	{	
		'zoomIn': function(eleNode)
		{
			// create our first breadcrumb if applicable
			if(this.breadcrumbs.crumbTrail.length == 0) this.breadcrumbs.addCrumb.bind(this, eleNode)();
			
			var intBaseFontSize = this.interface.links().getStyle('fontSize').toInt();
			var intFontMultiplier = 1;

			arrZoomTree = [eleNode];
			eleBranch = eleNode;

			while(eleBranch.getParent() != this.interface.links())
			{
				eleBranch = eleBranch.getParent();
				arrZoomTree.unshift(eleBranch);
			}

			// iterate through all the elements in the zoomtarget array getting their width percentage
			// we'll use this to calculate the absolute font size to use during our font size transition
			arrZoomTree.each(function(eleTargetNode) {
				intFontMultiplier = intFontMultiplier * (eleTargetNode.getStyle('fontSize').toInt() * 0.01);
			});

			// Get the absolute position of this node
			var objStartPosition = eleNode.getCoordinates();
			objStartPosition.fontSize = intBaseFontSize * intFontMultiplier;
			
			// Get the final position that this node will occupy
			var objEndPosition = this.interface.links().getCoordinates();
			objEndPosition.fontSize = intBaseFontSize;
			
			// Clone the original node
			var eleClonedNode = eleNode.clone(true);
			
			// delete the original node
			eleNode.destroy();
			
			// Inject the cloned node at the absolute coordinates the original node used to occupy
			//eleClonedNode.setStyles(objStartPosition);
			eleClonedNode = eleClonedNode.setStyles(objStartPosition);
			this.interface.links().adopt(eleClonedNode);
			
			// Morph the node from the starting coordinates to the end
			var objFx = new Fx.Morph(
				eleClonedNode,
				{
					'duration': 500,
					'onComplete': function()
					{
						this.interface.links().setStyle('backgroundColor', eleClonedNode.getStyle('backgroundColor'));
						
						this.remote.getContent.pass(eleNode.get('node'), this)();
					}.bind(this)
				}
			);
			
			// start the transition
			objFx.start(objEndPosition);
		},
		
		'zoomOut': function()
		{
			// Break the hash
			var arrHistoryArgs = this.breadcrumbs.crumbTrail.pop().split('/')
			var strParentId = arrHistoryArgs[0];
			var arrHSB = arrHistoryArgs[1].split(',');
			var arrColor = new Color([arrHSB[0].toInt(), arrHSB[1].toInt(), arrHSB[2].toInt()]);
			var arrPlacement = arrHistoryArgs[2].split('x');
			var arrSize = arrHistoryArgs[3].split('x');
			
			var strId = this.interface.links().get('node');
			
			// create our styles for the element that will be going through the effect
			var objOriginalStyles = this.interface.links().getCoordinates();
			
			var objStartStyles = $merge( objOriginalStyles, {
				'backgroundColor': this.interface.links().getStyle('backgroundColor'),
				'position': 'absolute',
				'fontSize': this.interface.links().getStyle('fontSize')
			} );
			
			// create a new element that will only be used for our effect transition
			var eleZoom = new Element('div', {'styles': objStartStyles});
			eleZoom.set('html', this.interface.links().innerHTML);
			eleZoom.inject(this.interface.zui.bind(this)());
			
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
				function( strId )
				{
					this.removeEvents( 'finishedDrawing' );
					eleThisNodeInParent = this.interface.links().getElement('div:node('+strId+')');
					
					objEndStyles = {
						'width': Math.round(objStartStyles.width * (arrSize[0] / 100)),
						'height': Math.round(objStartStyles.height * (arrSize[1] / 100)),
						'left': Math.round(objStartStyles.width * (arrPlacement[0] / 100)),
						'top': Math.round(objStartStyles.height * (arrPlacement[1] / 100))
					}
					
					var intBaseFontSize = this.interface.links().getStyle('fontSize').toInt();
					var intFontMultiplier = 1;

					arrZoomTree = [eleThisNodeInParent];
					eleBranch = eleThisNodeInParent;

					while(eleBranch.getParent() != this.interface.links())
					{
						eleBranch = eleBranch.getParent();
						arrZoomTree.unshift(eleBranch);
					}

					// iterate through all the elements in the zoomtarget array getting their width percentage
					// we'll use this to calculate the absolute font size to use during our font size transition
					arrZoomTree.each(function(eleTargetNode) {
						intFontMultiplier = intFontMultiplier * (eleTargetNode.getStyle('fontSize').toInt() * 0.01);
					});
					
					objEndStyles.fontSize = intBaseFontSize * intFontMultiplier;
					
					objFx.start(objEndStyles); 
					
				}.bind(this, strId)
			);
			
			// clear the div
			this.interface.links().set('html');
			this.interface.links().setStyle('backgroundColor', arrColor);

			// get nodes
			this.remote.getContent.bind(this, strParentId)();
		}
	},
	
	'remote':
	{
		'getContent': function(intId)
		{	
			if(!intId) intId = this.options.start;
			
			var objOptions =
			{
				'url': 'node/request',
				'secure': false,
				'method': 'post',
				'data':
				{
					'id': intId,
					'depth': this.options.depth
				},
				'onComplete': function(objJson)
				{	
					this.interface.links().empty().adopt(this.interface.padding(objJson.title));
					this.interface.content().empty().adopt(this.interface.padding(objJson.content));
					this.interface.links().set('node', objJson.id);

					this.interface.links().removeEvents( 'click' );
					// set the click event for the top container node
					this.interface.links().addEvents({
						'click': function()
						{
							if(this.breadcrumbs.crumbTrail.length >= 1) window.back();
						}.bind(this)
					});
					// did we get any links to other nodes
					if(objJson.links) this.interface.nodes.pass([this.interface.links(), objJson.links], this)();
				}.bind(this)
			};
			var objJsonRequest = new Request.JSON(objOptions).send();
		}

	}

} );

// Put the ZUI in the global scope
var objZUI = {};

window.addEvent('domready', function() {
	objZUI = new ZUI({'start': 1});
});
