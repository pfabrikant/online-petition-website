exports.insertSignature = function(signature, id) {
    return new Promise(function(resolve, reject) {
        if (signature !== '' && typeof id == 'number') {
            resolve({
                command: 'INSERT',
                rowCount: 1,
                oid: 0,
                rows: [],
                fields: [],
                _parsers: [],
                RowCtor: null,
                rowAsArray: false,
                _getTypeParser: function() {}
            });
        } else {
            reject('error');
        }
    });

};