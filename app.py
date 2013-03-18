#python lib
import os
#flask lib
from flaskext.enterprise import Enterprise
from flask import Flask, render_template

#config Flask
app = Flask(__name__)

#config Flask Enterprise
enterprise = Enterprise(app)
String = enterprise._sp.String
Integer = enterprise._sp.Integer
Boolean = enterprise._sp.Boolean
Array = enterprise._scls.Array

class Service(enterprise.SOAPService):
    """Soap Service Class
    
    Attributes:
        __soap_target_namespace__ : namespace for soap service
        __soap_server_address__ : address of soap service
    """
    __soap_target_namespace__ = 'MyNS'
    __soap_server_address__ = '/soap'

    @enterprise.soap(String, _returns=String)
    def echo(self, mystring):
        """ Function that return the string in args
        
        Args:
            mystring : string

        Returns:
            return a string
        """
        return mystring

    @enterprise.soap(Integer, Integer, _returns=Integer)
    def sum(self, x, y):
        """ Function to sum two integer
        
        Args:
            x : int
            y : int
            
        Returns:
            return an int
        """
        return x+y
    
    @enterprise.soap(Integer, Integer, _returns=Boolean)
    def equal(self, x, y):
        """ Function to compare two integer
        
        Args:
            x : int
            y : int
            
        Returns:
            return a boolean
        """
        return x==y
    
    @enterprise.soap(Integer, _returns=Array(Integer))
    def createArray(self, lenA):
        """ Function to create an array of integer
        
        Args:
            lenA : int
            
        Returns:
            return an array
        """
        return [int(x) for x in range(1,lenA+1)]

@app.route('/')
def pageIndex():
    """ The index page
    """
    return render_template("index.html")

@app.errorhandler(404)
def page_not_found(e):
    """ Error 404
    """
    return render_template("404.html"), 404

@app.errorhandler(403)
def forbidden(e):
    """ Error 403
    """
    return render_template("403.html"), 403

@app.errorhandler(410)
def gone(e):
    """ Error 410
    """
    return render_template("410.html"), 410

@app.errorhandler(500)
def internal_server_error(e):
    """ Error 500
    """
    return render_template("500.html"), 500

if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
