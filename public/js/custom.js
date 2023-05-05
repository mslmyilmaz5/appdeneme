// =============  Data Table - (Start) ================= //

$(document).ready(function(){
    
    var table = $('#example').DataTable({
        
        buttons:['copy', 'csv', 'excel', 'print']
        
    });
    
    
    table.buttons().container()
    .appendTo('#example_wrapper :eq(0)');
    var $tableSearch = $('#tableSearch');
    $('#example_filter').detach().appendTo($tableSearch);
    $('#example_length').detach().prependTo($tableSearch);
    $('<div>').css({
      'display': 'flex',
      'justify-content': 'flex-end' // Align items to the right
    }).append($('#example_filter'), $('#example_length')).appendTo($tableSearch);
     
});

// =============  Data Table - (End) ================= //
