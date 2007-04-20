/*
© Copyright 2006 Apple Computer, Inc. All rights reserved.

IMPORTANT:  This Apple software ("Apple Software") is supplied to you in consideration of your agreement to the following terms. Your use, installation and/or redistribution of this Apple Software constitutes acceptance of these terms. If you do not agree with these terms, please do not use, install, or redistribute this Apple Software.

Provided you comply with all of the following terms, Apple grants you a personal, non-exclusive license, under Apple’s copyrights in the Apple Software, to use, reproduce, and redistribute the Apple Software for the sole purpose of creating Dashboard widgets for Mac OS X. If you redistribute the Apple Software, you must retain this entire notice in all such redistributions.

You may not use the name, trademarks, service marks or logos of Apple to endorse or promote products that include the Apple Software without the prior written permission of Apple. Except as expressly stated in this notice, no other rights or licenses, express or implied, are granted by Apple herein, including but not limited to any patent rights that may be infringed by your products that incorporate the Apple Software or by other works in which the Apple Software may be incorporated.

The Apple Software is provided on an "AS IS" basis.  APPLE MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION THE IMPLIED WARRANTIES OF NON-INFRINGEMENT, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, REGARDING THE APPPLE SOFTWARE OR ITS USE AND OPERATION ALONE OR IN COMBINATION WITH YOUR PRODUCTS.

IN NO EVENT SHALL APPLE BE LIABLE FOR ANY SPECIAL, INDIRECT, INCIDENTAL OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) ARISING IN ANY WAY OUT OF THE USE, REPRODUCTION, AND/OR DISTRIBUTION OF THE APPLE SOFTWARE, HOWEVER CAUSED AND WHETHER UNDER THEORY OF CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY OR OTHERWISE, EVEN IF APPLE HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

function CreateOvalShape(ovalShapeID, spec)
{
	var ovalShapeElement = document.getElementById(ovalShapeID);
	if (!ovalShapeElement.loaded) 
	{
		ovalShapeElement.loaded = true;
		var height = 20;
		if (ovalShapeElement.offsetHeight > 0) 
		{
			height = ovalShapeElement.offsetHeight;
		}
		var width = 20;
		if (ovalShapeElement.offsetWidth > 0)
		{
			width = ovalShapeElement.offsetWidth;
		}
		ovalShapeElement.object = new OvalShape(ovalShapeElement, height, width, "Images/" + ovalShapeID + ".png");
		
		return ovalShapeElement.object;
	}
}

function OvalShape(ovalShape, height, width, img)
{
	this._init(ovalShape, height, width, img);
}

OvalShape.prototype._init = function(ovalShape, height, width, img)
{	
	this._imgPath = img;

	var style = null;
	var element = null;

	var container = document.createElement("div");
	this._container = container;

	ovalShape.appendChild(container);
	
	// Create the inner elements	
	var element = document.createElement("div");
	var style = element.style;
	style.position = "absolute";
	style.display = "inline-block";
	style.background = "url(" + this._imgPath + ") no-repeat top left";
	style.height = height + "px";
	style.width = width + "px";
	container.appendChild(element);

	style = container.style;
	style.left = 0;
	style.right = 0;
	style.width = "auto";
	style.height = height + "px";
}

OvalShape.prototype.remove = function()
{
	var parent = this._container.parentNode;
	parent.removeChild(this._container);
}

OvalShape.prototype._updateImages = function(height, width)
{
	this._container.style.height = height + "px";
	
	var div = this._container.children[0];
	div.style.background = "url(" + this._imgPath + ") no-repeat top left";
	div.style.height = height + "px";
	div.style.width = width + "px";
}