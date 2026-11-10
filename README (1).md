ASSETGUARD AI - PREDICTIVE MAINTENANCE AND REPAIR JOB ADVISORY PLATFORM


PROBLEM STATEMENT
Meridian Heavy Industries runs sixteen hundred rotating machines across four factories at Pune, Chennai, Vadodara and
Jamshedpur. Pumps, compressors, conveyors, motors, cooling units and gear units are monitored continuously, and every week
each machine reports its vibration, its bearing temperature, its oil condition and its alarm count.
The reliability desk receives more condition data than it can read. Breakdowns that were visible in the readings for a fortnight are
found only after the machine has stopped, and the repair jobs raised afterwards are written from memory rather than from the
manuals. Two failures in the last quarter were traced to procedures that were followed incorrectly because nobody opened the
document.
Meridian requires a system that reads the condition of the fleet, judges which machines are closest to failing, drafts the repair job
for the machine an engineer selects, and holds that repair job until a maintenance supervisor approves it. No machine may be
taken out of service on the word of a model alone.

OBJECTIVE
Build AssetGuard AI, a working predictive maintenance platform that a maintenance planner can use end to end. The finished
system must:
     ● Clean five raw extracts that arrive with real data-quality defects, and prove how dirty each one was.
     ● Train two machine learning models on tabular data, one that predicts whether a machine will break down within thirty days
       and one that estimates how many hours a repair will take, and one NLP model that reads free-text technician notes and
       names the problem type they describe.
     ● Build a searchable knowledge base from sixteen maintenance documents so that every instruction issued can be traced to
       the document it came from.
     ● Run a multi-agent workflow in which each agent is a language model call that interprets facts produced by the models and
       the knowledge base, never a calculation of its own.
     ● Stop that workflow before any repair job is issued and wait for a human decision, and survive the machine being switched
       off while it waits.
     ● Record every run, every drafted repair job, every supervisor decision and every language model call in a database that can
       be audited afterwards.
     ● Serve all of it through a REST service and a dashboard a maintenance supervisor could use without being told how.
     ● Put every figure the dashboard shows behind that REST service, so the dashboard holds no rule and reads no file of its
       own.
     ● Require everyone to sign in, and show each of the three roles only the pages their role covers, with the service refusing the
       matching request on its own account rather than trusting the dashboard to hide it.
     ● Answer maintenance questions from the sixteen documents and from nothing else, in exactly one language model call per
       question, refusing rather than guessing when the documents do not cover what was asked.

PROJECT STRUCTURE




DATASET DESCRIPTION


machine_breakdown_train.csv AND machine_breakdown_eval.csv: COLUMNS


repair_downtime_train.csv AND repair_downtime_eval.csv: COLUMNS




technician_notes.csv: COLUMNS




machine_breakdown_train.csv: SAMPLE RECORDS


repair_downtime_train.csv: SAMPLE RECORDS


technician_notes.csv: SAMPLE RECORDS




current_fleet.csv: SAMPLE RECORDS


data/docs/: KNOWLEDGE BASE DOCUMENTS


DOMAIN KNOWLEDGE CONTEXT
This section is background reading, not a specification. Nothing in it is assessed and no function has to reproduce anything from
it. It exists because the datasets, the sixteen documents and the dashboard all speak the language of a maintenance
department, and a team that has never worked in a plant should not have to guess what a risk factor, a bearing fault or a permit is
while also building the system.
Every figure quoted below is taken from the documents supplied under data/docs/, so the same figure can be found, and
questioned, through the manual chat once the knowledge base is built. Where a limit is also a project constant it is named as a
constant rather than written out as a number, because config/config.py is the one place those values live and the two must never
be allowed to disagree.

MAINTENANCE WORK AND WHY IT IS PLANNED THIS WAY
MRO stands for maintenance, repair and operations: the work of keeping installed plant running, as distinct from making the
product. A plant can go about it in three ways.

Reactive, or run to failure, means fixing the machine after it stops. It needs no planning at all, which is what makes it expensive:
production stops without warning, the failure usually damages more than the part that started it, and the spare is rarely on the
shelf.

Preventive means servicing on a fixed interval, by calendar or by running hours, whether the machine needs it or not. It is
predictable and it is what most plants do, but it spends effort on healthy machines and still misses the ones that fail early.

Predictive means watching what the machine's condition is actually doing and acting when the condition says to. It needs
measurements, a history to compare them against, and somebody willing to act on a machine that has not yet broken. That is the
way of working this project is built to support.

Two more terms recur throughout. Downtime is the number of hours a machine is out of service; planned downtime is chosen
and worked around, unplanned downtime is not, and costs several times as much. A repair job, called a work order in many
plants, is the document that authorises and records one piece of maintenance work: what is wrong, what will be done, who does
it, which permits it needs, which parts it consumes and how long the machine will be down.

HOW A MACHINE TELLS YOU IT IS UNWELL
A rotating machine in good order behaves consistently. It is change, far more than any single reading, that carries the signal. Four
measurements do most of the work, and the condition data carries all four.

Vibration. Every rotating machine vibrates. A fault changes the amount, and more usefully the pattern. Meridian measures overall
RMS velocity in millimetres per second across the 10 to 1000 Hz band, taken at the bearing housing in the horizontal, vertical


and axial directions, because most faults show more strongly in one direction than the others. Guide 01 places a reading in one
of four zones, and the limits widen with machine size, which is why power_rating_kw has to be read alongside the reading itself.




The condition data reports this as average_vibration, highest_vibration and vibration_change_pct. The last of these matters
more than it looks: a machine that has moved from 1.2 to 2.4 mm/s in a fortnight is telling a louder story than one that has sat at
3.0 mm/s for two years.


Bearing temperature. Measured at the bearing housing rather than inside the machine. A bearing losing its lubricant, or carrying
a load it was not designed for, runs hot before it fails. Ambient conditions matter, which is why room_temperature_c is recorded
next to average_temperature_c and highest_temperature_c: the same seventy degrees means one thing on a Pune afternoon and
another on a cool night shift.

Oil condition. Oil carries wear debris out of a machine, and how much debris it is carrying is the clearest early warning there is.
Cleanliness is reported as a three-number code counting particles above 4, 6 and 14 microns. Guide 02 notes that each reduction
of one code roughly doubles the remaining bearing life, which is why filtration is treated as a reliability control rather than
housekeeping. Targets differ by machine type, and so does how often a sample is drawn.




The condition data carries oil_dirtiness_score, where a higher number is a dirtier oil, and days_since_oil_check, which says how
much of that reading can still be trusted.

Alarms. alarms_this_week counts the condition alarms the monitoring system raised. A single alarm is often noise. A count that
climbs week on week is a machine asking for attention.

Duty and history. How hard a machine is worked, and what has already happened to it, changes what any reading means.
running_hours_per_week, average_load_pct and starts_per_week describe the duty, and a start loads a machine far more heavily
than an hour of steady running. machine_age_months, days_since_last_service, services_last_year and breakdowns_last_year
describe the history.

THE FAULTS THIS PLANT SEES




The eight problem types the project recognises are held in config.VALID_PROBLEM_TYPES. What each one is:

Bearing Wear. A bearing is what lets a shaft turn while carrying its load. Most here are rolling element bearings, hardened balls or
rollers running between two rings. As the surfaces fatigue they flake, and every rolling element that passes strikes the damage,
so the fault announces itself as high frequency energy that is not a multiple of the shaft speed, an audible growl, and a housing
temperature that creeps up. Bearings seldom fail of their own accord. The usual root causes are poor lubrication, misalignment
and unbalance, which is why Guide 03 warns that the real cause is often missed once the bearing has been replaced and the
machine runs quietly again.


Shaft Misalignment. Two shafts joined by a coupling are never perfectly in line, and the question is only whether they are within
tolerance. Guide 03 calls misalignment the second most common cause of rotating equipment failure after lubrication problems.
It transmits a cyclic load into the bearings and seals every revolution, so it surfaces as a bearing or a seal failure rather than as an
alignment defect. Tolerance tightens sharply with speed.




Poor Lubrication. Too little grease, too much, the wrong grade, or oil that has degraded or been contaminated. Guide 02 forbids
mixing mineral and synthetic lubricants outright. This is the most common root cause of bearing failure, and it is also the
cheapest to prevent, which is why the oil columns carry so much weight in the condition data.

Seal Leak. A seal keeps the process fluid in and dirt out. When it fails, product or oil escapes and contamination enters, and the
machine often has to be stopped for reasons of safety and housekeeping before it has broken in any mechanical sense.

Overheating. A temperature above what the machine normally runs at. It is a symptom rather than a cause, and it points back at
lubrication, alignment, an overload, a blocked cooler or simply a hot day.

Electrical Fault. Winding insulation breaking down, phase imbalance, loose terminations, bearing currents. It shows in the current
the machine draws, which is why average_current_amp is recorded, more reliably than it shows in vibration.

Blade Damage. Pump impellers and fan blades erode, corrode and are struck by whatever the process carries. The machine loses
head or flow, and vibration appears at the frequency at which the blades pass a fixed point.

Belt Wear. Belts stretch, wear and lose tension. The drive slips, the driven machine underperforms, and the vibration appears
below shaft speed at the frequency of the belt itself.

WHAT RISK FACTORS MEANS, AND WHY IT MEANS TWO THINGS HERE
The phrase is used in two senses in this project, and confusing them is the commonest way to misread the whole system.
In the everyday plant sense, the risk factors for a machine are the conditions that make a failure likelier: its age, the hours it runs,
the number of times it is started, the load it carries, how dirty its oil is, how long since it was last serviced, how many alarms it
has raised, how many times it has already broken down, and the conditions of the room it sits in. Nobody assigns these weights
on paper. An experienced planner reads them together and forms a judgement.
In the project's sense, risk is one number and one label. The breakdown model reads a single week of condition data for a
machine and returns a probability, between 0 and 1, that the machine will suffer a breakdown within thirty days.
classify_risk_band cuts that probability into config.RISK_BAND_HIGH, config.RISK_BAND_MEDIUM and config.RISK_BAND_LOW
at the two thresholds config.HIGH_RISK_THRESHOLD and config.MEDIUM_RISK_THRESHOLD, and Policy 01 states what a
planner is expected to do in each band: raise the repair job immediately and seek shutdown authorisation for the highest,
schedule within the current planning cycle and confirm parts for the middle, and continue monitoring for the lowest.
Three things are worth holding on to.
     ● A band is a planning label, not a measurement. A machine in the highest band has not failed, and may not fail. It has been
        placed at the front of the queue.
     ● A band authorises nothing on its own. Safety Rule 02 is explicit: a predicted failure risk, however high, does not by itself
        authorise a shutdown.
     ● Not every column is a risk factor. Some are recorded because a plant records them and not because they predict anything,
        and a few of those have been left in the data deliberately.

HOW THE PLANT DECIDES WHAT TO DO FIRST
importance is a property of the machine, fixed on its record, and it describes what the machine's failure would cost the factory
rather than what the machine cost to buy. A Critical machine stops production when it stops. An Important machine degrades it.
A Standard machine can wait.
Priority is then a function of importance and risk band together. Policy 01 sets the grid, config.PRIORITY_MATRIX holds it, and
planners may not override the result without recording a justification against the repair job. The consequence is one that
surprises people new to maintenance: a Standard machine in the highest risk band does not outrank a Critical machine in the
middle band. The plant is protecting production, not the machine.
Priority in turn sets how quickly the work has to move, and who hears about it if it does not.


Commercial cover changes the plan before it starts. Under Policy 02 any intervention on a machine still under manufacturer
warranty by in-house or third party labour voids what remains of that warranty unless written consent was obtained first, so
warranty_end_date has to be checked before a job is drafted rather than after. Where a manufacturer service contract is in force
the call is raised with the manufacturer before an in-house job is written, and where third party labour is used the time it takes
them to reach site is added to the downtime estimate. Wear items such as belts, filters and seal packing are excluded from every
contract.

GETTING THE WORK DONE SAFELY
Three documents govern how a repair is carried out, and between them they explain most of what a drafted repair job has to say.
Power lockout, known in most plants as lockout or tagout, is Safety Rule 01. A permit is required whenever a guard is removed, a
person puts any part of their body into a danger zone, a pressure boundary is broken or an electrical enclosure is opened, and the
rule states that where there is doubt the permit is required. Every energy source is identified first, and the list is longer than
people expect: electrical, mechanical, hydraulic, pneumatic, thermal, gravitational and stored rotational energy. Each source is
isolated, every person working on the machine applies their own lock and a tag carrying their name and the repair job number,
stored energy is released, and the isolation is proved by attempting a start with the normal controls. Only the person who applied
a lock may remove it. Permits expire.




Tight space entry is Safety Rule 03, and it is the reason access_level exists as a column. A tight space is any enclosure with
limited means of entry or exit that was not designed for somebody to stay in: at Meridian that means cooling unit sumps,
conveyor tunnels, pump pits deeper than 1.2 metres and compressor enclosures with the doors taken off. Entry requires a power
lockout permit already in force, atmospheric testing for oxygen, flammable gas and toxic gas before entry and again every thirty
minutes, forced ventilation running throughout, rescue equipment rigged, and a trained standby attendant at the entry point who
never enters and does no part of the work. That is why the same repair takes materially longer in a tight space, and why the
estimate for a job whose access_level is config.ACCESS_LEVEL_TIGHT_SPACE is stretched by
config.TIGHT_SPACE_DURATION_FACTOR: the crew is one person larger and that person contributes nothing to the task.


Shutdown approval is Safety Rule 02, and it is the rule the whole human gate in this system exists to satisfy. No machine may be
taken out of service without an approved authorisation, and who signs depends on how important the machine is and how long it
will be down.




Critical machines are shut down inside a planned window unless the condition is an imminent failure risk, and
config.STANDARD_SHUTDOWN_WINDOW carries the standard one. The rule also fixes what a shutdown request must contain,
which is close to a description of the repair job this system drafts: the machine and its line, the predicted risk band and the
evidence for it, the probable problem type and the procedure reference, the estimated downtime and the basis of that estimate,
parts availability with lead times, the permits required, the proposed window, and the name and role of the authoriser. The
decision is one of three, APPROVE, MODIFY or REJECT, a modified job keeps the original draft alongside the amended one, and
every decision is retained for a minimum of seven years and is subject to audit. That retention requirement is the reason this
project stores what it stores.

READING A TECHNICIAN'S NOTE
The last thing to understand about the data is the least tidy part of it. A technician's note is written at the machine, often at the
end of a shift, by somebody whose job is the repair and not the paperwork. It is short, abbreviated, unevenly capitalised,
frequently misspelled, sometimes carries markup dragged in from whatever system it was pasted through, and it uses trade
shorthand freely. These are real notes from technician_notes.csv, next to the problem type recorded against the same job.


The second row is the one to study. The note mentions a bearing twice, a bearing was in fact replaced, and the job was still
recorded as misalignment, because the coupling was what was wrong and the bearing was only what it damaged. This is exactly
the trap Guide 03 describes, and it is why searching a note for the word bearing is not a way of finding bearing faults. The third
and fourth rows show why the text has to be cleaned before it is read: the same fault, the same words, one in lower case with the
shift engineer misspelled and one shouted in capitals with the greasing misspelled. The fifth shows a note that records the
process faithfully and says nothing at all about the fault.

A SHORT GLOSSARY


TASKS


============== DATA PREPARATION ================


The five raw files under data/ come from separate factory systems and disagree with one another about spelling, units, date
format, punctuation and the way "missing" is written. Nothing downstream may assume a clean table. The seven modules below
turn those raw exports into the cleaned tables under processed/, produce the evidence that the cleaning was needed, and
prepare a cleaned table for a model.

Every path, spelling correction, validation limit and business rule already exists in config/config.py, which is supplied. No function
in this section needs a default parameter value; the caller passes the constant it needs.

MODULE: data_pipeline/dataset_loader.py
Reads tables from disk and writes them back. It is the only place in the data preparation section that touches CSV files, so every
other module works on tables that are already in memory. Raw files and cleaned files are read differently, because a raw file must
not have its column types guessed while a cleaned file already has trustworthy types.

FUNCTION SIGNATURE
load_raw_dataset(file_path, null_tokens)
PARAMETERS
file_path — Text. The path of one raw file, taken from config, for example config.RAW_BREAKDOWN_TRAIN_FILE.
null_tokens — List of text values. The ways "missing" is written in the raw files, from config.NULL_TOKEN_LIST.
PURPOSE
Bring one raw CSV file into memory in a form that hides nothing and guesses nothing, so that the cleaning work sees the file
exactly as it was written.
REQUIREMENTS
    ● Every column holds text, whatever its values look like, including a column of mostly numbers carrying one value written
      with a unit attached.
    ● A cell holding any of the values in null_tokens is empty rather than holding that text.
    ● The usual blank-cell conventions of the file format count as missing alongside the supplied tokens.
    ● The row count and the column count match the file on disk; nothing is filtered at load time.
RETURNS
One table holding every row of the named file, with all columns as text and every recognised missing token already empty.

FUNCTION SIGNATURE
load_processed_dataset(file_path)
PARAMETERS
file_path — Text. The path of one cleaned file written earlier by save_processed_dataset, taken from config, for example
config.CLEAN_BREAKDOWN_EVAL_FILE.
PURPOSE


Bring a cleaned table back into memory for modelling, scoring or lookup work.
REQUIREMENTS
     ● Column types reflect the file contents, number columns arriving as numbers and text columns as text, with no conversion
       left to the caller.
     ● The table matches the file exactly; no cleaning, filtering or repair is applied to a file the cleaning modules already produced.
RETURNS
One table holding the cleaned dataset with its columns already typed.

FUNCTION SIGNATURE
save_processed_dataset(dataframe, file_path)
PARAMETERS
dataframe — Table. A cleaned table, typically the result of clean_breakdown_dataset, clean_downtime_dataset or
clean_technician_note_dataset.
file_path — Text. The destination path, taken from config, for example config.CLEAN_DOWNTIME_TRAIN_FILE.
PURPOSE
Persist a cleaned table so that later stages of the project can read it without repeating the cleaning work.
REQUIREMENTS
     ● The written file carries the data columns only, with the internal row numbering absent as an extra column that
       load_processed_dataset would read back as a feature.
     ● Reading the written file with load_processed_dataset reproduces the same columns in the same order.
     ● The destination folder is assumed to exist; creating it is the caller's responsibility.
RETURNS
The path the table was written to, so the caller can report it.



MODULE: data_pipeline/common_cleaning.py
Holds the repair steps that more than one dataset needs: whitespace, missing tokens, duplicates, machine tags, category
spellings, dates, numbers stored as text, yes/no columns, impossible readings and gap filling. Each function fixes exactly one
kind of problem and hands back a table, so a dataset-specific module can assemble the steps it needs. No function here
modifies the table it was given; the caller always works with the returned table.

FUNCTION SIGNATURE
strip_text_whitespace(dataframe)
PARAMETERS
dataframe — Table. A table straight from load_raw_dataset, in which every column is still text.
PURPOSE
Remove the padding spaces that the source systems left around values, so that comparisons against known values succeed.
REQUIREMENTS
     ● No value in any column carries a leading or trailing space, and no hand-picked subset of columns is exempt.
     ● The visible content of a value is otherwise unchanged, including spaces that sit inside it.
     ● Cells that were already empty are still empty rather than a blank string.
     ● The table passed in is as it was; the cleaned version is a separate table.
RETURNS
The table with the padding removed from every value.

FUNCTION SIGNATURE
replace_missing_tokens(dataframe, null_tokens)
PARAMETERS
dataframe — Table. A table whose values have already had their padding removed by strip_text_whitespace.
null_tokens — List of text values. The ways "missing" is written, from config.NULL_TOKEN_LIST.
PURPOSE
Catch the missing-value words that survived loading because they were written with spaces around them, so that only one kind of
missing value exists from this point on.
REQUIREMENTS
     ● A cell whose whole content is one of the values in null_tokens, with or without padding around it, is empty rather than a
       real value.
     ● A cell that merely contains such a token inside a longer piece of text is untouched.
     ● Every column is covered, since any column may carry one of these tokens.
     ● The table passed in is as it was.
RETURNS
The table with every remaining missing-value token replaced by an empty cell.

FUNCTION SIGNATURE
remove_duplicate_records(dataframe)
PARAMETERS
dataframe — Table. Any table at any stage of cleaning.
PURPOSE


Discard rows that repeat a row already present, so that a repeated export does not give some records extra weight during
training.
REQUIREMENTS
    ● No row survives that is identical to another row across all of its columns.
    ● Of a group of identical rows, the earliest one survives and the rest are gone.
    ● Row positions run consecutively from the start, with no gaps left where rows were removed.
RETURNS
The table with repeated rows removed and its row positions renumbered.

FUNCTION SIGNATURE
standardize_machine_code(dataframe)
PARAMETERS
dataframe — Table. A table containing an machine_code column.
PURPOSE
Bring every machine tag into one written form so that the same physical machine is recognised as the same machine across all
five raw files.
REQUIREMENTS
    ● A tag made of three letters for the machine type, three letters for the factory and a four digit number appears in one form
      only: upper case, hyphen separated, as in PMP-PUN-0142.
    ● The same tag written with underscores, with spaces, in lower case, or with its separators deleted altogether reaches that
      same single form, which means a tag stripped of its separators is rebuilt from its three parts rather than having one
      separator swapped for another.
    ● A tag whose letters and digits do not fit that three-letter, three-letter, four-digit shape is the upper case run of those letters
      and digits rather than being forced into the pattern.
    ● Empty tags stay empty.
RETURNS
The table with the machine_code column rewritten in the single accepted form.

FUNCTION SIGNATURE
normalize_category_column(dataframe, column_name, value_mapping)
PARAMETERS
dataframe — Table. A table containing the named column.
column_name — Text. The name of the one text column to correct, for example machine_type.
value_mapping — Dictionary. Messy spelling in lower case on the left, correct value on the right, taken from config, for example
config.MACHINE_TYPE_MAPPING, config.FACTORY_NAME_MAPPING, config.IMPORTANCE_MAPPING or
config.USAGE_PATTERN_MAPPING.
PURPOSE
Replace the many spellings of one category value with the single correct spelling recorded in config, so that a model treats them
as one category rather than several.
REQUIREMENTS
    ● A value differing from an entry of value_mapping only in letter case, in padding, or in a run of several spaces where one
      space belongs reaches that entry's correct value.
    ● A value with no entry in value_mapping is empty rather than kept, because an unrecognised spelling is not evidence of
      anything.
    ● Only the column named by column_name changes.
RETURNS
The table with the named column holding only the corrected values or empty cells.

FUNCTION SIGNATURE
normalize_problem_type_column(dataframe, valid_problem_types)
PARAMETERS
dataframe — Table. A table containing a problem_type column.
valid_problem_types — List of text values. The complete set of recognised problem types, from config.VALID_PROBLEM_TYPES.
PURPOSE
Bring problem type labels into the one written form the project recognises and discard labels that are not part of that set.
REQUIREMENTS
    ● A label differing from an entry of valid_problem_types only by underscores in place of spaces, by padding, or by
      capitalisation reaches that entry.
    ● A label that appears nowhere in valid_problem_types is empty rather than a category of its own.
RETURNS
The table with the problem_type column holding only recognised labels or empty cells.

FUNCTION SIGNATURE
parse_mixed_format_dates(dataframe, date_columns)
PARAMETERS
dataframe — Table. A table whose date columns are still text.
date_columns — List of text values. The names of the columns holding dates, from config, for example
config.BREAKDOWN_DATE_COLUMNS, config.DOWNTIME_DATE_COLUMNS or config.NOTE_DATE_COLUMNS.


PURPOSE
Turn date text into real dates so that a date can be compared or subtracted rather than only printed.
REQUIREMENTS
    ● Each row of a named column is read on its own terms, since a single column mixes written formats from row to row, for
      example 2026-03-02, 2026/03/02, 02-Mar-2026 and 02 March 2026.
    ● The day and the month are not swapped for any of the formats present.
    ● A value unreadable as a date is empty rather than a stopped run.
    ● Only the named columns change.
RETURNS
The table with each named column holding real dates.

FUNCTION SIGNATURE
convert_text_to_numeric(dataframe, numeric_columns)
PARAMETERS
dataframe — Table. A table whose measurement columns are still text.
numeric_columns — List of text values. The names of the columns that must end up as numbers, from config, for example
config.BREAKDOWN_NUMERIC_COLUMNS or config.DOWNTIME_NUMERIC_COLUMNS.
PURPOSE
Turn measurements that were stored as text with decoration attached into plain numbers a model can use.
REQUIREMENTS
    ● No value carries a unit suffix described by config.UNIT_SUFFIX_PATTERN in any capitalisation the file uses, nor a
      thousands separator or percent sign described by config.THOUSANDS_AND_PERCENT_PATTERN.
    ● A value written as a percentage keeps the number that was written rather than a fraction rescaled from it.
    ● A value unreadable as a number is empty rather than a stopped run.
    ● Only the named columns change, and a column already holding numbers is undamaged.
RETURNS
The table with each named column holding real numbers or empty cells.

FUNCTION SIGNATURE
normalize_boolean_columns(dataframe, boolean_columns)
PARAMETERS
dataframe — Table. A table whose yes/no columns are still text.
boolean_columns — List of text values. The names of the yes/no columns, from config.DOWNTIME_BOOLEAN_COLUMNS.
PURPOSE
Turn yes/no columns written in many different ways into a single numeric form a model can consume.
REQUIREMENTS
    ● A value matching an entry of config.BOOLEAN_TRUE_TOKENS, compared without regard to capitalisation or padding, is 1.
    ● Anything that is not such a token, an empty cell included, is 0, so these columns carry no missing value.
    ● The values are whole numbers rather than text or true/false values.
    ● Only the named columns change.
RETURNS
The table with each named yes/no column holding 1 or 0.

FUNCTION SIGNATURE
remove_out_of_range_measurements(dataframe, range_limits)
PARAMETERS
dataframe — Table. A table whose measurement columns already hold numbers.
range_limits — Dictionary. Column name on the left, the lowest and highest values that column may hold on the right, taken from
config, for example config.BREAKDOWN_RANGE_LIMITS, config.DOWNTIME_RANGE_LIMITS or
config.TECHNICIAN_NOTE_RANGE_LIMITS.
PURPOSE
Treat readings that could not physically have occurred as missing, rather than letting them train a model.
REQUIREMENTS
    ● A reading outside the pair of limits configured for its column in range_limits is empty, while a reading equal to either limit
      is kept.
    ● The placeholder codes some sensors wrote in place of a value are also empty, since they sit outside every configured
      range and need no handling of their own.
    ● Every row survives; only the offending cell is emptied, so a single bad sensor does not cost the project every other
      measurement on that row.
    ● A column named in range_limits but absent from the table is skipped without error.
RETURNS
The table with impossible readings replaced by empty cells.

FUNCTION SIGNATURE
remove_rows_missing_target(dataframe, target_column)
PARAMETERS
dataframe — Table. A cleaned table that still contains rows with no recorded answer.


target_column — Text. The name of the column the model must predict, from config.BREAKDOWN_TARGET_COLUMN or
config.DOWNTIME_TARGET_COLUMN.
PURPOSE
Discard rows that cannot contribute to training because the answer they are supposed to teach is not recorded.
REQUIREMENTS
    ● No row has an empty value in target_column.
    ● A row missing some other value is kept, those gaps being filled elsewhere.
    ● Row positions run consecutively from the start.
RETURNS
The table containing only rows that carry a recorded answer.

FUNCTION SIGNATURE
resolve_missing_measurements(dataframe, numeric_columns)
PARAMETERS
dataframe — Table. A table whose measurement columns already hold numbers and still contain gaps.
numeric_columns — List of text values. The names of the measurement columns, from config, for example
config.BREAKDOWN_NUMERIC_COLUMNS or config.DOWNTIME_NUMERIC_COLUMNS.
PURPOSE
Fill the remaining gaps in the measurement columns so that no row has to be discarded for a single missing reading.
REQUIREMENTS
    ● Every gap in a named column holds the middle value of that same column, taken over the values actually present in it,
      rather than the average that a handful of very large readings would drag away from the typical reading.
    ● Values that were present are unchanged.
    ● A column named in numeric_columns but absent from the table is skipped without error.
RETURNS
The table with every gap in the named measurement columns filled.

FUNCTION SIGNATURE
resolve_missing_categories(dataframe, category_columns)
PARAMETERS
dataframe — Table. A table whose category columns have already been corrected by normalize_category_column and may now
contain gaps.
category_columns — List of text values. The names of the category columns, from config, for example
config.BREAKDOWN_CATEGORY_COLUMNS or config.DOWNTIME_CATEGORY_COLUMNS.
PURPOSE
Record "not known" as an explicit category so that a row with an unrecognised or absent category value is still usable.
REQUIREMENTS
    ● Every gap in a named category column holds config.UNKNOWN_CATEGORY_VALUE.
    ● Values that were present are unchanged, so the corrected spellings survive.
    ● A column named in category_columns but absent from the table is skipped without error.
RETURNS
The table with every gap in the named category columns filled with the configured stand-in value.



MODULE: data_pipeline/breakdown_cleaning.py
Cleans the machine breakdown risk dataset, reading a raw file named in config and writing the matching cleaned file. It owns the
two problems no other dataset has: bearing temperatures that were recorded on the wrong scale, and vibration readings that
spiked far above what the sensor could really have seen. Everything else it needs comes from common_cleaning.

FUNCTION SIGNATURE
correct_temperature_units(dataframe, temperature_columns)
PARAMETERS
dataframe — Table. A table whose temperature columns already hold numbers, as produced by convert_text_to_numeric.
temperature_columns — List of text values. The bearing temperature columns, from config.TEMPERATURE_COLUMNS.
PURPOSE
Put every bearing temperature on one scale, because part of the fleet reported on the other scale and the mixture would
otherwise look like enormous variation in bearing health.
REQUIREMENTS
    ● A reading above config.FAHRENHEIT_DETECTION_LIMIT could not have been recorded on the Celsius scale for this fleet,
      and is re-expressed in Celsius from Fahrenheit.
    ● A reading at or below that limit is exactly as it was, never converted a second time.
    ● Converted readings carry a single decimal place, matching the precision of the readings that needed no conversion.
    ● Empty cells stay empty, and only the named columns change.
RETURNS
The table with every bearing temperature expressed in Celsius.

FUNCTION SIGNATURE
suppress_sensor_spikes(dataframe, vibration_columns)


PARAMETERS
dataframe — Table. A table whose vibration columns already hold numbers.
vibration_columns — List of text values. The vibration columns, from config.VIBRATION_COLUMNS.
PURPOSE
Treat vibration values that are far above the column's normal spread as sensor faults rather than as machine faults, so that a
handful of bad readings do not dominate what the model learns.
REQUIREMENTS
    ● The spike limit for a column comes from the quartile spread of that column itself under the rule
      config.OUTLIER_IQR_MULTIPLIER parameterises, so it adapts to each column rather than being a fixed number.
    ● Only unusually high readings are treated, low vibration being a normal machine state.
    ● A reading identified as a spike is empty rather than clipped to the limit, and its row survives.
    ● Only the named columns change.
RETURNS
The table with the spiked vibration readings replaced by empty cells.

FUNCTION SIGNATURE
clean_breakdown_dataset(input_path, output_path)
PARAMETERS
input_path — Text. The raw breakdown risk file to clean, from config.RAW_BREAKDOWN_TRAIN_FILE or
config.RAW_BREAKDOWN_EVAL_FILE.
output_path — Text. Where the cleaned table is written, from config.CLEAN_BREAKDOWN_TRAIN_FILE or
config.CLEAN_BREAKDOWN_EVAL_FILE.
PURPOSE
Produce the cleaned breakdown risk table that the breakdown risk model is trained and evaluated on, and leave a copy of it on
disk. The training file and the evaluation file are cleaned identically by this one function, with no branch on which of them it was
given, because a difference between them would make the evaluation meaningless.
REQUIREMENTS
    ● The saved table has no empty cell anywhere, and no text that config.NULL_TOKEN_LIST describes as a way of writing
      "missing" survives in it as if it were a real value.
    ● No row of the saved table is identical to another row, including rows made identical only by the repairs themselves, such
      as padding removed, spellings corrected and units converted.
    ● A row is absent from the saved table only for being a duplicate or for having no recorded value in
      config.BREAKDOWN_TARGET_COLUMN, which every surviving row carries; a row with a bad sensor reading is repaired
      rather than dropped.
    ● machine_type, factory_name, importance and usage_pattern hold only the correct values of
      config.MACHINE_TYPE_MAPPING, config.FACTORY_NAME_MAPPING, config.IMPORTANCE_MAPPING and
      config.USAGE_PATTERN_MAPPING respectively plus config.UNKNOWN_CATEGORY_VALUE, the columns of
      config.BREAKDOWN_NUMERIC_COLUMNS hold numbers inside the limits of config.BREAKDOWN_RANGE_LIMITS, and
      those of config.BREAKDOWN_DATE_COLUMNS hold real dates.
RETURNS
The cleaned table, so the caller can report its size and inspect the breakdown rate without reading the file back.



MODULE: data_pipeline/downtime_cleaning.py
Cleans the repair job downtime dataset, reading a raw file named in config and writing the matching cleaned file. The problem
unique to this dataset is repair cost recorded as decorated text rather than as a number; the yes/no repair job flags and the
problem type label also need attention here. Everything else comes from common_cleaning.

FUNCTION SIGNATURE
strip_currency_formatting(dataframe, currency_columns)
PARAMETERS
dataframe — Table. A table whose money columns are still text.
currency_columns — List of text values. The money columns, from config.CURRENCY_COLUMNS.
PURPOSE
Take the currency decoration off money values so that what remains is a plain number written as text.
REQUIREMENTS
    ● No value carries the currency marker or a thousands separator, wherever in the value they appeared.
    ● No padding surrounds what remains of a value.
    ● The named columns still hold text, producing an actual number from them being the job of convert_text_to_numeric.
    ● Empty cells stay empty, and only the named columns change.
RETURNS
The table with the money columns holding undecorated number text.

FUNCTION SIGNATURE
clean_downtime_dataset(input_path, output_path)
PARAMETERS
input_path — Text. The raw downtime file to clean, from config.RAW_DOWNTIME_TRAIN_FILE or
config.RAW_DOWNTIME_EVAL_FILE.


output_path — Text. Where the cleaned table is written, from config.CLEAN_DOWNTIME_TRAIN_FILE or
config.CLEAN_DOWNTIME_EVAL_FILE.
PURPOSE
Produce the cleaned repair job table that the downtime model is trained and evaluated on, and leave a copy of it on disk. The
training file and the evaluation file are cleaned identically by this one function, with no branch on which of them it was given.
REQUIREMENTS
    ● The saved table has no empty cell anywhere, and no row of it is identical to another row, including rows made identical
      only by the repairs themselves.
    ● A row is absent from the saved table only for being a duplicate or for having no recorded value in
      config.DOWNTIME_TARGET_COLUMN, which every surviving row carries.
    ● machine_type, factory_name, importance and usage_pattern hold only the correct values of the matching config
      mappings plus config.UNKNOWN_CATEGORY_VALUE, and problem_type holds only entries of
      config.VALID_PROBLEM_TYPES or config.UNKNOWN_CATEGORY_VALUE.
    ● The columns of config.DOWNTIME_BOOLEAN_COLUMNS hold 1 or 0, those of config.DOWNTIME_NUMERIC_COLUMNS
      hold numbers inside the limits of config.DOWNTIME_RANGE_LIMITS with the money column of
      config.CURRENCY_COLUMNS among them as a number rather than unreadable decorated text, and those of
      config.DOWNTIME_DATE_COLUMNS hold real dates.
RETURNS
The cleaned table, so the caller can report its size without reading the file back.



MODULE: data_pipeline/technician_note_cleaning.py
Cleans the free-text technician note dataset that the problem type classifier learns from. The notes were copied out of a web
based repair job system, so some still carry markup and broken characters, and the recorded note length no longer describes the
text it claims to measure. It writes the cleaned notes file named in config.

FUNCTION SIGNATURE
remove_markup_artifacts(dataframe, text_column)
PARAMETERS
dataframe — Table. A table containing the note text column.
text_column — Text. The name of the note column, from config.NOTE_TEXT_COLUMN.
PURPOSE
Take the leftover web markup and broken characters out of the note text so that the classifier learns from the technician's words
rather than from the source system's debris.
REQUIREMENTS
    ● No note text carries markup of the kind described by config.MARKUP_PATTERN or any of the broken character sequences
      listed in config.ENCODING_ARTIFACT_LIST.
    ● Words that sat on either side of removed markup are separated by a space rather than run together into a word that never
      existed.
    ● The technician's own words are untouched, including punctuation that is part of the note.
    ● Only the named column changes.
RETURNS
The table with the note text free of markup and broken characters.

FUNCTION SIGNATURE
normalize_note_whitespace(dataframe, text_column)
PARAMETERS
dataframe — Table. A table whose note text has already been through remove_markup_artifacts.
text_column — Text. The name of the note column, from config.NOTE_TEXT_COLUMN.
PURPOSE
Give every note a single consistent spacing so that two notes with the same words are the same piece of text, and so that the
recomputed note length is meaningful.
REQUIREMENTS
    ● Any run of spacing, line breaks and tabs included, reads as one single space.
    ● No spacing sits at the start or the end of a note.
    ● No word content is altered or removed.
    ● Only the named column changes.
RETURNS
The table with the note text evenly spaced.

FUNCTION SIGNATURE
drop_unusable_notes(dataframe, minimum_length)
PARAMETERS
dataframe — Table. A table whose note text has already been cleaned and evenly spaced.
minimum_length — Whole number. The shortest note that can still be classified, from config.MINIMUM_NOTE_LENGTH.
PURPOSE
Remove the rows that cannot teach the problem type classifier anything, either because there is nothing to read or because there
is no label to learn.


REQUIREMENTS
    ● No surviving row has an empty value in config.NOTE_TEXT_COLUMN or in config.NOTE_TARGET_COLUMN.
    ● Every surviving note is at least minimum_length characters long, judged on the cleaned text rather than on whatever the
      file recorded.
    ● A note of exactly minimum_length characters survives.
    ● Row positions run consecutively from the start.
RETURNS
The table containing only notes that carry both readable text and a recognised label.

FUNCTION SIGNATURE
recompute_note_length(dataframe, text_column)
PARAMETERS
dataframe — Table. A table whose notes have already been cleaned and filtered.
text_column — Text. The name of the note column, from config.NOTE_TEXT_COLUMN.
PURPOSE
Bring the recorded note length back into agreement with the note it describes, because the value in the raw file was measured
before the markup was stripped and is now wrong.
REQUIREMENTS
    ● note_length_chars equals the character count of the cleaned note text on every row, no stale value from the raw file
      surviving anywhere in the column.
    ● The note text itself is unchanged.
RETURNS
The table with note_length_chars describing the cleaned text.

FUNCTION SIGNATURE
clean_technician_note_dataset(input_path, output_path)
PARAMETERS
input_path — Text. The raw notes file, from config.RAW_TECHNICIAN_NOTES_FILE.
output_path — Text. Where the cleaned notes are written, from config.CLEAN_TECHNICIAN_NOTES_FILE.
PURPOSE
Produce the cleaned technician note table that the problem type classifier is trained on and that the running application searches
for similar historical notes, and leave a copy of it on disk.
REQUIREMENTS
    ● The saved table has no empty cell anywhere, and no row of it is identical to another row, including rows made identical
      only by the markup stripping and the spacing repair.
    ● No value of config.NOTE_IDENTIFIER_COLUMN appears twice in the saved table, the earliest occurrence being the one
      kept, because two notes sharing an identifier are the same note recorded twice.
    ● Every surviving note is at least config.MINIMUM_NOTE_LENGTH characters long, carries a label drawn from
      config.VALID_PROBLEM_TYPES, and has note_length_chars in agreement with its cleaned text.
    ● The columns named in config.NOTE_DATE_COLUMNS hold real dates, machine_code, machine_type and factory_name
      follow the same standardised forms used by the other two datasets so a note can be matched to a machine across files,
      and row positions run consecutively from the start.
RETURNS
The cleaned note table, so the caller can report its size without reading the file back.



MODULE: data_pipeline/feature_builder.py
Turns a cleaned table into the two things a model needs: the set of columns it is allowed to see, and a preprocessing step that
puts those columns into numeric form. It is used identically at training time and at scoring time, which is what keeps a live
prediction consistent with what the model was trained on. It performs no cleaning of its own and assumes the table came from
load_processed_dataset.


FUNCTION SIGNATURE
select_model_features(dataframe, excluded_columns)
PARAMETERS
dataframe — Table. A cleaned table, typically from load_processed_dataset.
excluded_columns — List of text values. The columns the model must not see, from
config.BREAKDOWN_IDENTIFIER_COLUMNS or config.DOWNTIME_IDENTIFIER_COLUMNS.
PURPOSE
Keep identifiers and other descriptive columns away from the model, since they describe which row this is rather than what
condition the machine is in. A serial number or an machine_code reaching the model would let it memorise individual machines,
which looks accurate during training and fails on the machines the application actually serves.
REQUIREMENTS
    ● None of the columns named in excluded_columns appear in the returned table.
    ● A column named in excluded_columns but absent from the table is ignored without error, the same identifier list being
      applied to tables that do not all carry every identifier.
    ● Every other column survives, in the order it had, because the column order is what a saved feature schema is later
      compared against.


RETURNS
The table with the identifier columns removed and the remaining columns in their original order.

FUNCTION SIGNATURE
split_features_and_target(dataframe, target_column)
PARAMETERS
dataframe — Table. The result of select_model_features.
target_column — Text. The name of the answer column, from config.BREAKDOWN_TARGET_COLUMN or
config.DOWNTIME_TARGET_COLUMN.
PURPOSE
Separate the answer the model must learn from the inputs it is allowed to learn from. Leaving the answer among the inputs
would let the model read it off its own input and report a score that cannot be reproduced in service.
REQUIREMENTS
    ● The column named by target_column is absent from the input side.
    ● The inputs and the answer stay aligned row for row, so that the answer on any row still belongs to that row's inputs.
    ● The order of the remaining input columns is unchanged.
RETURNS
Two things in a fixed order: the input columns, followed by the answer column.

FUNCTION SIGNATURE
identify_column_types(feature_frame)
PARAMETERS
feature_frame — Table. The input columns produced by split_features_and_target.
PURPOSE
Work out which input columns are measurements and which are categories, so that each group can be prepared in the way that
suits it.
REQUIREMENTS
    ● Every column of feature_frame belongs to exactly one of the two groups, neither missing from both nor present in both.
    ● The decision follows the type a column actually holds rather than a hardcoded list of column names, so that the same
      function serves both datasets.
    ● The result names the columns rather than carrying their values, so it can be handed straight to
      build_preprocessing_pipeline.
RETURNS
Two lists of column names in a fixed order: the measurement columns, followed by the category columns.

FUNCTION SIGNATURE
build_preprocessing_pipeline(numeric_columns, categorical_columns)
PARAMETERS
numeric_columns — List of text values. The measurement column names, as returned by identify_column_types.
categorical_columns — List of text values. The category column names, as returned by identify_column_types.
PURPOSE
Build the single reusable step that converts a table of mixed measurements and categories into the all-numeric form a model
requires, so that training and scoring cannot drift apart.
REQUIREMENTS
    ● The result is one unfitted object covering both groups and applied to the whole table in one action, rather than separate
      transformations the caller has to remember to repeat the same way, and any quantity learned from data is learned when
      the caller fits it on training data and is reused unchanged afterwards.
    ● The columns named in numeric_columns come out with any remaining gaps filled and on a common scale, whatever the
      size of the units they were measured in.
    ● The columns named in categorical_columns come out with any remaining gaps filled and each distinct category carried by
      an indicator column of its own, and a category value unseen at fitting time contributes nothing rather than causing a
      failure.
    ● The output has one row for every input row, holds no empty value, and has more columns than there are entries in
      numeric_columns.
RETURNS
One preprocessing step which, when fitted, converts a table of the given columns into an all-numeric matrix.



MODULE: data_pipeline/quality_profiler.py
Measures how dirty a raw table is before any cleaning touches it, and writes those measurements to the report file named in
config. It is the project's evidence that the cleaning work was necessary and that it worked, so it runs against tables straight from
load_raw_dataset rather than against cleaned ones. It only counts; it never repairs anything.


FUNCTION SIGNATURE
count_missing_values(dataframe)
PARAMETERS
dataframe — Table. A raw table from load_raw_dataset, before any cleaning.
PURPOSE


Record how many cells are empty in each column, as one half of the evidence that the raw files needed work.
REQUIREMENTS
    ● Only columns with at least one empty cell appear in the result, a column with none being absent rather than reported as
      zero.
    ● Each count is a plain whole number, because the result is written to a text report file and must survive that.
    ● The table is not modified.
RETURNS
A mapping from column name to the number of empty cells in that column, covering only the affected columns.

FUNCTION SIGNATURE
count_duplicate_records(dataframe)
PARAMETERS
dataframe — Table. A raw table from load_raw_dataset, before any cleaning.
PURPOSE
Record how many rows repeat a row already present, matching what remove_duplicate_records would discard.
REQUIREMENTS
    ● A row counts as a repeat only when it matches another row across all of its columns.
    ● The earliest occurrence of a repeated row is uncounted; only the repeats of it count.
    ● The count is a plain whole number that can be written to a text report file.
RETURNS
The number of rows that repeat an earlier row.

FUNCTION SIGNATURE
count_out_of_range_values(dataframe, range_limits)
PARAMETERS
dataframe — Table. A raw table from load_raw_dataset, in which the measurement columns are still text.
range_limits — Dictionary. Column name on the left, the lowest and highest values that column may hold on the right, from config,
for example config.BREAKDOWN_RANGE_LIMITS, config.DOWNTIME_RANGE_LIMITS or
config.TECHNICIAN_NOTE_RANGE_LIMITS.
PURPOSE
Record how many readings in each column could not physically have occurred, as the other half of the evidence that the raw files
needed work.
REQUIREMENTS
    ● The count is correct even though the raw column still holds text, so it does not depend on the cleaning having run.
    ● A value unreadable as a number is uncounted here, belonging to count_missing_values instead.
    ● Only columns with at least one offending value appear in the result, each carrying a plain whole number.
    ● A column named in range_limits but absent from the table is skipped without error, and the table is not modified.
RETURNS
A mapping from column name to the number of readings outside that column's allowed range, covering only the affected
columns.

FUNCTION SIGNATURE
build_quality_report(dataframe, dataset_name, range_limits)
PARAMETERS
dataframe — Table. A raw table from load_raw_dataset, before any cleaning.
dataset_name — Text. A short label identifying which dataset this record describes, for example the file's own name without its
folder or extension.
range_limits — Dictionary. The allowed range for each measurement column of this dataset, from the matching config constant.
PURPOSE
Gather every quality measurement for one dataset into a single record so that the five datasets can be reported side by side.
REQUIREMENTS
    ● The record carries, under these exact names, dataset_name, row_count, column_count, duplicate_rows, missing_values
      and out_of_range_values.
    ● The duplicate, missing and out-of-range parts are what count_duplicate_records, count_missing_values and
      count_out_of_range_values report, rather than logic repeated here.
    ● Every value in the record is of a kind that can be written to a text report file, sizes being plain whole numbers.
    ● The record describes the raw table as it was given, so this belongs before the dataset is cleaned.
RETURNS
One record describing the quality of a single dataset.

FUNCTION SIGNATURE
save_quality_report(report_records, output_path)
PARAMETERS
report_records — List of records. One record per dataset, each produced by build_quality_report.
output_path — Text. Where the report is written, from config.DATA_QUALITY_REPORT_FILE.
PURPOSE
Write the quality measurements for all five datasets to one report file that a reviewer can open and read.
REQUIREMENTS


     ● All the records sit in a single file, in the order they were given, so the five datasets read in a predictable sequence.
     ● The file is structured text that a person can read directly, laid out over multiple lines rather than crammed onto one.
     ● Any non-English characters present in the data survive being written and read back.
     ● The destination folder is assumed to exist; creating it is the caller's responsibility.
RETURNS
The path the report was written to, so the caller can report it.



=============== MODEL TRAINING AND THE KNOWLEDGE BASE ===============


========== GROUP: MODEL TRAINING ===========


Three of the scores a trained model reaches are held to a minimum. config.MINIMUM_BREAKDOWN_ROC_AUC is the lowest
ROC AUC the breakdown model may reach on the held-out file, config.MINIMUM_DOWNTIME_R2 the lowest R squared the
downtime model may reach on its own held-out file, and config.MINIMUM_PROBLEM_TYPE_ACCURACY the lowest share of
notes the problem type model may read correctly. Each sits well below what a sound solution reaches, so a different but
reasonable modelling choice is not penalised, while a model that has learned almost nothing is. The values are in the
configuration and are not repeated here.

MODULE: modeling/model_registry.py
This module is the single place where trained artefacts leave memory and reach disk, and the only place they are read back.
Alongside each model it stores the feature schema, the ordered list of input column names the model was trained on, so that
anything scoring a record later can rebuild the inputs in the order the model expects. Every other part of the project loads its
models through this module rather than reading files itself.

FUNCTION SIGNATURE
save_model_artifact(model_object, artifact_path)
PARAMETERS
model_object — A trained artefact that is finished and ready to be reused, either a winning model chosen by one of the training
modules or the fitted text converter produced by build_text_vectorizer.
artifact_path — Text. The location the artefact is written to, supplied by the caller from config, for example
config.BREAKDOWN_MODEL_FILE, config.DOWNTIME_MODEL_FILE, config.PROBLEM_TYPE_MODEL_FILE or
config.TEXT_VECTORIZER_FILE.
PURPOSE
Persist a trained artefact so that a later process can use it without retraining anything.
REQUIREMENTS
     ● The written artefact must restore through load_model_artifact in a separate process and behave identically to
       model_object.
     ● Whatever preparation model_object carries internally must survive the round trip intact, with nothing downstream
       reapplying it.
     ● A tabular model is stored as one artefact carrying its own preparation, so a saved model can score a record that still holds
       its original text values; the text converter and the text classifier are each stored as they are.
     ● The artefact must land at artifact_path, a location under config.MODEL_DIRECTORY that the entry point has already
       created.
RETURNS
The path the artefact was written to.

FUNCTION SIGNATURE
load_model_artifact(artifact_path)
PARAMETERS
artifact_path — Text. The location of an artefact previously written by save_model_artifact, named from config.
PURPOSE
Restore a trained artefact from disk so that the API service and the agents can use it.
REQUIREMENTS
     ● The restored artefact must be usable immediately, with no further training or preparation.
     ● Two restorations of the same file must produce identical answers for identical inputs.
RETURNS
The restored artefact.

FUNCTION SIGNATURE
save_feature_schema(feature_names, schema_path)
PARAMETERS
feature_names — A sequence of column names in the exact order the model was trained on, taken from the feature table that
train_breakdown_model or train_downtime_model built.
schema_path — Text. Where the schema is written, from config, either config.BREAKDOWN_SCHEMA_FILE or
config.DOWNTIME_SCHEMA_FILE.
PURPOSE


Record the exact inputs a model was trained on, so a record built later can be checked and ordered against that record rather
than guessed at.
REQUIREMENTS
    ● The recorded names must hold the exact order of feature_names, as a list rather than a set.
    ● The written form must be plain text a person can open and read, whose names and order come back unchanged through
      load_feature_schema.
    ● The recorded names must be model inputs only, holding neither the target column nor any column listed in
      config.BREAKDOWN_IDENTIFIER_COLUMNS or config.DOWNTIME_IDENTIFIER_COLUMNS.
RETURNS
The path the schema was written to.

FUNCTION SIGNATURE
load_feature_schema(schema_path)
PARAMETERS
schema_path — Text. The location of a schema previously written by save_feature_schema, named from config.
PURPOSE
Read back the ordered list of training columns so a record can be assembled in the order the model was trained on.
REQUIREMENTS
    ● The returned list must match the list handed to save_feature_schema element for element and in the same order.
RETURNS
The ordered list of training column names.



MODULE: modeling/model_evaluation.py
This module turns a trained model and a set of records it has not learned from into a plain dictionary of named scores, and
collects those dictionaries into a comparison table and a report file. It exists so that every candidate in every training module is
measured the same way and can be laid side by side. Overall correctness alone is misleading here, because breakdowns are a
minority of machine weeks and a model that never predicts one still looks accurate.

FUNCTION SIGNATURE
evaluate_classification_model(trained_model, feature_frame, target_series)
PARAMETERS
trained_model — A trained breakdown classifier, either one candidate from train_candidate_classifiers or the final saved model.
feature_frame — A table of input columns the model did not learn from.
target_series — The true breakdown outcome for each row of feature_frame, the column named by
config.BREAKDOWN_TARGET_COLUMN.
PURPOSE
Measure how well one breakdown classifier performs on records it has not seen, and report the result as a set of named scores.
REQUIREMENTS
    ● Every score must be keyed by name, and the same set of names must come back for every model handed to this function.
    ● The dictionary must carry a score showing what share of the real breakdowns were caught, and a score that does not
      depend on where the yes-or-no cut-off sits, alongside overall correctness.
    ● The scores must be plain numbers that can be written straight into a report file, not objects.
    ● Scoring must succeed on a set of records where one of the two outcomes happens not to appear.
RETURNS
A dictionary of score names to numbers for this one model.

FUNCTION SIGNATURE
evaluate_regression_model(trained_model, feature_frame, target_series)
PARAMETERS
trained_model — A trained downtime estimator, either one candidate from train_candidate_regressors or the final saved model.
feature_frame — A table of input columns the model did not learn from.
target_series — The true repair duration for each row of feature_frame, the column named by
config.DOWNTIME_TARGET_COLUMN.
PURPOSE
Measure how close one downtime estimator gets to the real repair durations on records it has not seen.
REQUIREMENTS
    ● The same set of score names must come back for every estimator handed to this function.
    ● At least one score must be expressed in hours, readable directly as how far out the estimate typically is.
    ● At least one score must show whether the model has learned anything beyond always answering with the average
      duration.
    ● All scores must be plain numbers suitable for a report file.
RETURNS
A dictionary of score names to numbers for this one estimator.

FUNCTION SIGNATURE
evaluate_text_classifier(trained_model, document_matrix, label_series)
PARAMETERS


trained_model — A trained problem type classifier, either one candidate from train_candidate_text_classifiers or the final saved
model.
document_matrix — The numeric form of a set of technician notes, produced by applying the converter from
build_text_vectorizer to the note text.
label_series — The true problem type for each note in document_matrix, the column named by config.NOTE_TARGET_COLUMN.
PURPOSE
Measure how well one problem type classifier reads technician notes.
REQUIREMENTS
    ● The same set of score names must come back for every classifier handed to this function.
    ● The dictionary must carry a score in which a rare mode from config.VALID_PROBLEM_TYPES counts for as much as a
      common one, since the modes are not equally frequent.
    ● All scores must be plain numbers suitable for a report file.
RETURNS
A dictionary of score names to numbers for this one classifier.

FUNCTION SIGNATURE
compare_candidate_scores(evaluation_scores, primary_metric)
PARAMETERS
evaluation_scores — A dictionary keyed by candidate name, where each value is the score dictionary that one of the evaluate
functions in this module returned for that candidate.
primary_metric — Text. The name of the score the comparison is ordered by, one of the keys present in every candidate's score
dictionary, chosen by the caller.
PURPOSE
Lay every candidate's scores out as one table so the comparison can be printed and read at a glance.
REQUIREMENTS
    ● The table must hold one row per candidate, with the candidate name in its own column and every score name as its own
      column.
    ● Rows must be ordered so the strongest candidate on primary_metric sits at the top.
    ● Row positions must be renumbered from the top so the printed table reads as a ranking.
    ● The table must contain only values taken from evaluation_scores, with no score computed and no metric chosen inside
      the function.
RETURNS
A table of candidates and their scores with the strongest at the top.

FUNCTION SIGNATURE
save_evaluation_report(report_records, output_path)
PARAMETERS
report_records — A dictionary holding the final scores of all three models, keyed by model, where each value is a score dictionary
from one of the evaluate functions in this module.
output_path — Text. Where the report is written, from config.MODEL_METRICS_FILE.
PURPOSE
Write the final scores of every model to one report file that can be inspected after a training run.
REQUIREMENTS
    ● The file must be structured, machine-readable text rather than a printed log, laid out so a person can read it without
      tooling.
    ● The nesting of report_records must survive, keeping each model's scores grouped under that model.
    ● The file must land at output_path under config.OUTPUT_DIRECTORY, which the entry point has already created.
RETURNS
The path the report was written to.



MODULE: modeling/breakdown_model.py
This module produces the breakdown risk model: given one week of condition data for a machine, how likely is that machine to
break down within thirty days. Several different kinds of classifier are built, trained on the same data and compared on records
none of them learned from, with the strongest refined further and saved together with the preparation its inputs need. Choosing
which kinds to compare, and which score decides the winner, is part of the work.

FUNCTION SIGNATURE
build_candidate_classifiers(numeric_columns, categorical_columns, random_seed)
PARAMETERS
numeric_columns — The list of measurement columns, as returned by identify_column_types.
categorical_columns — The list of text columns, as returned by identify_column_types.
random_seed — A whole number fixing every random choice a candidate makes, passed in as config.RANDOM_SEED.
PURPOSE
Create the set of untrained candidates that will compete to become the breakdown risk model.
REQUIREMENTS
    ● Each candidate must be one self-contained unit carrying the preparation from build_preprocessing_pipeline, able to take
      cleaned records whose text columns still hold their original category values with no separate preparation step.


    ● The candidates must span genuinely different families of approach rather than variations on one idea.
    ● Every candidate must report a breakdown likelihood between 0 and 1 rather than only a yes or a no, that number being
      what config.HIGH_RISK_THRESHOLD and config.MEDIUM_RISK_THRESHOLD are applied to.
    ● The candidates must be set up so the breakdown minority, roughly one machine week in five, is not ignored in favour of
      always answering no breakdown.
RETURNS
A dictionary of stable candidate name to untrained candidate.

FUNCTION SIGNATURE
train_candidate_classifiers(candidate_models, feature_frame, target_series)
PARAMETERS
candidate_models — The dictionary of untrained candidates returned by build_candidate_classifiers.
feature_frame — The portion of the training inputs set aside for learning.
target_series — The true breakdown outcome for each row of feature_frame.
PURPOSE
Train every candidate on identical data so that any later difference between them comes from the approach and not from what
they were shown.
REQUIREMENTS
    ● Every candidate must see exactly the same rows and the same columns of feature_frame and target_series.
    ● The candidate names from candidate_models must come back unchanged, so a trained candidate can still be matched to
      its score.
    ● Each candidate's training time must appear in the run log, since training cost differs enormously between approaches.
    ● No candidate may be scored or selected here.
RETURNS
A dictionary of candidate name to trained candidate.

FUNCTION SIGNATURE
select_best_classifier(trained_models, evaluation_scores, primary_metric)
PARAMETERS
trained_models — The dictionary of trained candidates returned by train_candidate_classifiers.
evaluation_scores — A dictionary keyed by the same candidate names, where each value is the score dictionary that
evaluate_classification_model returned for that candidate.
primary_metric — Text. The name of the score that decides the winner, chosen by the caller and present in every candidate's
score dictionary.
PURPOSE
Identify which trained candidate performed best on the records none of them learned from.
REQUIREMENTS
    ● The winner must be the candidate with the strongest value of primary_metric and nothing else, with no preference for any
      particular family built in.
    ● The decision must rest on scores measured on data the candidates did not learn from, never on their training data.
    ● Both the winning name and the winning trained candidate itself must come back.
RETURNS
The name of the winning candidate and the trained candidate itself.

FUNCTION SIGNATURE
tune_selected_classifier(selected_model, feature_frame, target_series)
PARAMETERS
selected_model — The winning trained candidate returned by select_best_classifier.
feature_frame — The portion of the training inputs set aside for learning, the same rows the candidates were trained on.
target_series — The true breakdown outcome for each row of feature_frame.
PURPOSE
Improve the winning candidate by trying a small number of alternative settings and keeping whichever performs best.
REQUIREMENTS
    ● Only settings belonging to the family of selected_model may be tried, with the family worked out from the model handed in
      rather than told.
    ● Each setting combination must be judged on records it did not learn from, so an apparent improvement is a real one rather
      than memorisation.
    ● The set of combinations tried must stay small enough that the whole training run finishes in a reasonable time.
    ● The refined result must still be one self-contained unit carrying its own preparation, exactly like the candidate handed in.
RETURNS
The winning candidate rebuilt with its best settings.

FUNCTION SIGNATURE
train_breakdown_model(train_path, model_output_path)
PARAMETERS
train_path — Text. The cleaned training file, passed in as config.CLEAN_BREAKDOWN_TRAIN_FILE.
model_output_path — Text. Where the finished model is written, passed in as config.BREAKDOWN_MODEL_FILE.
PURPOSE


Run the whole breakdown risk workflow end to end, from the cleaned training data through to a saved model with its feature
schema. The comparison table must be visible in the run log so the reasoning behind the choice can be read.
REQUIREMENTS
    ● The model inputs must exclude config.BREAKDOWN_TARGET_COLUMN and every column in
      config.BREAKDOWN_IDENTIFIER_COLUMNS, which describe the row rather than the machine's condition.
    ● The division of train_path must follow config.VALIDATION_SPLIT_RATIO and be reproducible under
      config.RANDOM_SEED, with the held-back part carrying breakdowns in the same proportion as the whole file.
    ● config.CLEAN_BREAKDOWN_EVAL_FILE must stay unread anywhere in this function, as the final hold-out.
    ● The saved model must have learned from all of train_path and must reach model_output_path through
      save_model_artifact, with its ordered input columns written to config.BREAKDOWN_SCHEMA_FILE through
      save_feature_schema, identical in names and order to the columns the saved model was fitted on.
RETURNS
The trained model that was saved.



MODULE: modeling/downtime_model.py
This module produces the second model: given a repair job, how many hours the machine will be out of service. The answer is a
duration rather than a yes or no, and the maintenance planner cannot book a shutdown window without it. As with the risk model,
several different approaches are compared on held-back records, the strongest is refined, and the winner is saved with the
preparation its inputs need.

FUNCTION SIGNATURE
build_candidate_regressors(numeric_columns, categorical_columns, random_seed)
PARAMETERS
numeric_columns — The list of measurement columns, as returned by identify_column_types.
categorical_columns — The list of text columns, as returned by identify_column_types.
random_seed — A whole number fixing every random choice a candidate makes, passed in as config.RANDOM_SEED.
PURPOSE
Create the set of untrained candidates that will compete to become the downtime estimator.
REQUIREMENTS
    ● Each candidate must be one self-contained unit carrying the preparation from build_preprocessing_pipeline, able to take
      cleaned records whose text columns still hold their original category values.
    ● Every candidate must answer with a duration in hours rather than a category.
    ● The candidates must span genuinely different families of approach, including at least one deliberately simple one that the
      more elaborate approaches have to beat.
    ● Every candidate carrying any randomness must be fixed by random_seed.
RETURNS
A dictionary of stable candidate name to untrained candidate.

FUNCTION SIGNATURE
train_candidate_regressors(candidate_models, feature_frame, target_series)
PARAMETERS
candidate_models — The dictionary of untrained candidates returned by build_candidate_regressors.
feature_frame — The portion of the training inputs set aside for learning.
target_series — The true repair duration for each row of feature_frame.
PURPOSE
Train every candidate estimator on identical data so the comparison is fair.
REQUIREMENTS
    ● Every candidate must see exactly the same rows and the same columns of feature_frame and target_series.
    ● The candidate names from candidate_models must come back unchanged.
    ● Each candidate's training time must appear in the run log.
    ● No candidate may be scored or selected here.
RETURNS
A dictionary of candidate name to trained candidate.

FUNCTION SIGNATURE
select_best_regressor(trained_models, evaluation_scores, primary_metric)
PARAMETERS
trained_models — The dictionary of trained candidates returned by train_candidate_regressors.
evaluation_scores — A dictionary keyed by the same candidate names, where each value is the score dictionary that
evaluate_regression_model returned for that candidate.
primary_metric — Text. The name of the score that decides the winner, chosen by the caller.
PURPOSE
Identify which trained estimator performed best on the records none of them learned from.
REQUIREMENTS
    ● The winner must be the candidate with the strongest value of primary_metric and nothing else.
    ● A winner must still be picked when every candidate scores below zero, which a regression score may legitimately do.
    ● Both the winning name and the winning trained estimator must come back.


RETURNS
The name of the winning estimator and the trained estimator itself.

FUNCTION SIGNATURE
tune_selected_regressor(selected_model, feature_frame, target_series)
PARAMETERS
selected_model — The winning trained estimator returned by select_best_regressor.
feature_frame — The portion of the training inputs set aside for learning.
target_series — The true repair duration for each row of feature_frame.
PURPOSE
Improve the winning estimator by trying a small number of alternative settings and keeping whichever performs best.
REQUIREMENTS
    ● Only settings belonging to the family of selected_model may be tried, with the family worked out from the model handed in
      rather than told.
    ● Each setting combination must be judged on records it did not learn from.
    ● The set of combinations tried must stay small enough not to dominate the run time.
    ● The refined result must still be one self-contained unit carrying its own preparation.
RETURNS
The winning estimator rebuilt with its best settings.

FUNCTION SIGNATURE
train_downtime_model(train_path, model_output_path)
PARAMETERS
train_path — Text. The cleaned training file, passed in as config.CLEAN_DOWNTIME_TRAIN_FILE.
model_output_path — Text. Where the finished model is written, passed in as config.DOWNTIME_MODEL_FILE.
PURPOSE
Run the whole downtime workflow end to end, from the cleaned repair jobs through to a saved estimator with its feature schema.
The comparison table must be visible in the run log so the choice can be read.
REQUIREMENTS
    ● The model inputs must exclude config.DOWNTIME_TARGET_COLUMN and every column in
      config.DOWNTIME_IDENTIFIER_COLUMNS.
    ● The division of train_path must follow config.VALIDATION_SPLIT_RATIO and be reproducible under
      config.RANDOM_SEED, while config.CLEAN_DOWNTIME_EVAL_FILE stays unread anywhere in this function.
    ● The saved estimator must have learned from all of train_path and must reach model_output_path through
      save_model_artifact, with its ordered input columns written to config.DOWNTIME_SCHEMA_FILE through
      save_feature_schema, agreeing exactly on names and order.
    ● Every duration the saved estimator produces must be greater than 0 hours, including for records whose category columns
      still hold the original text values that build_planned_repair_record supplies.
RETURNS
The trained estimator that was saved.



MODULE: modeling/problem_type_model.py
This module produces the third model: reading what a technician wrote in free text and deciding which problem type it describes.
Free text has to be turned into numbers before any classifier can learn from it, and that converter has to be kept and saved
alongside the classifier, because a new note must be converted exactly the same way it was during training. Several classifiers
are compared on notes none of them learned from and the strongest is saved.

FUNCTION SIGNATURE
build_text_vectorizer()
PARAMETERS
None.
PURPOSE
Create the untrained converter that turns technician note text into the numeric form a classifier can learn from.
REQUIREMENTS
    ● A term must weigh by how distinctive it is, so a word appearing in nearly every note contributes almost nothing while a
      rare, diagnostic word contributes strongly.
    ● Short phrases must be recognisable as clues in their own right and not only as their separate words, since an oil term
      sitting beside a level term means something the two words alone do not.
    ● Terms appearing in only a handful of notes across the whole corpus, and very common English filler words, must be
      absent from the vocabulary.
    ● Repeated calls must produce an identically configured converter each time, each holding no vocabulary yet.
RETURNS
An untrained text-to-numbers converter.

FUNCTION SIGNATURE
build_candidate_text_classifiers(random_seed)
PARAMETERS


random_seed — A whole number fixing every random choice a candidate makes, passed in as config.RANDOM_SEED.
PURPOSE
Create the set of untrained classifiers that will compete to read technician notes.
REQUIREMENTS
    ● Each candidate must learn directly from the wide, mostly zero numeric form that the converter from build_text_vectorizer
      produces.
    ● The candidates must span genuinely different families of approach.
    ● Every candidate carrying any randomness must be fixed by random_seed, and any candidate that solves iteratively must
      be allowed enough iterations to settle on this vocabulary size.
    ● No preparation may sit inside these candidates, conversion being the converter's job.
RETURNS
A dictionary of stable candidate name to untrained classifier.

FUNCTION SIGNATURE
train_candidate_text_classifiers(candidate_models, document_matrix, label_series)
PARAMETERS
candidate_models — The dictionary of untrained classifiers returned by build_candidate_text_classifiers.
document_matrix — The numeric form of the notes set aside for learning, produced by the converter from build_text_vectorizer.
label_series — The true problem type for each note in document_matrix.
PURPOSE
Train every text classifier on the same converted notes so the comparison is fair.
REQUIREMENTS
    ● Every candidate must see exactly the same converted notes and the same labels.
    ● The candidate names from candidate_models must come back unchanged.
    ● Each candidate's training time must appear in the run log.
    ● No candidate may be scored or selected here.
RETURNS
A dictionary of candidate name to trained classifier.

FUNCTION SIGNATURE
select_best_text_classifier(trained_models, evaluation_scores, primary_metric)
PARAMETERS
trained_models — The dictionary of trained classifiers returned by train_candidate_text_classifiers.
evaluation_scores — A dictionary keyed by the same candidate names, where each value is the score dictionary that
evaluate_text_classifier returned for that candidate.
primary_metric — Text. The name of the score that decides the winner, chosen by the caller.
PURPOSE
Identify which trained text classifier performed best on the notes none of them learned from.
REQUIREMENTS
    ● The winner must be the candidate with the strongest value of primary_metric and nothing else.
    ● Both the winning name and the winning trained classifier must come back.
RETURNS
The name of the winning classifier and the trained classifier itself.

FUNCTION SIGNATURE
train_problem_type_model(notes_path, model_output_path)
PARAMETERS
notes_path — Text. The cleaned technician notes file, passed in as config.CLEAN_TECHNICIAN_NOTES_FILE.
model_output_path — Text. Where the finished classifier is written, passed in as config.PROBLEM_TYPE_MODEL_FILE.
PURPOSE
Run the whole problem type workflow end to end, from the cleaned notes through to a saved classifier and the converter needed
to read a new note. The vocabulary size and the comparison table must be visible in the run log.
REQUIREMENTS
    ● The note text must come from config.NOTE_TEXT_COLUMN and the answer from config.NOTE_TARGET_COLUMN,
      divided in the proportion of config.VALIDATION_SPLIT_RATIO reproducibly under config.RANDOM_SEED, with the held-
      back part carrying every mode in the same proportion as the whole file.
    ● The vocabulary used for the comparison must be built from the learning notes alone, with the held-back notes converted
      through that same vocabulary rather than one built from themselves.
    ● The saved classifier and the saved converter must both have learned from all of the notes and must reach
      model_output_path and config.TEXT_VECTORIZER_FILE through save_model_artifact, so the width of the numeric form
      the saved converter produces matches the vocabulary it holds.
    ● Every label the saved classifier can produce must be one of config.VALID_PROBLEM_TYPES, it must be able to produce
      more than one of them, and the same note classified twice must produce the same label.
RETURNS
The trained classifier and the fitted converter, both of which the agents need.

=========== GROUP: KNOWLEDGE BASE ==========


MODULE: knowledge/pdf_extraction.py
This module reads the maintenance corpus in config.DOCS_DIRECTORY and pulls the written text out of each document. Every
document there is a digital file with a real text layer, so no image recognition is needed or available. The text it produces is the
raw material for everything the knowledge base later searches.

FUNCTION SIGNATURE
extract_text_from_pdf(pdf_path)
PARAMETERS
pdf_path — Text. The full path to one document inside config.DOCS_DIRECTORY.
PURPOSE
Read one maintenance document and return everything written in it as a single continuous string.
REQUIREMENTS
    ● Every page must be read, in the order it appears, and joined into one string.
    ● A page that yields no text must be skipped without breaking the run and without leaving an empty placeholder in the joined
      result.
    ● Page boundaries must be separated in the joined text rather than running the closing word of one page into the opening
      word of the page that follows.
    ● Nothing may be cleaned, cut or reformatted here.
RETURNS
The full text of the document as one string.

FUNCTION SIGNATURE
extract_text_from_directory(docs_directory)
PARAMETERS
docs_directory — Text. The folder holding the maintenance corpus, passed in as config.DOCS_DIRECTORY.
PURPOSE
Read every maintenance document in a folder and return one record per document, keeping the file name attached to its text.
REQUIREMENTS
    ● Only document files may be read, with anything else in docs_directory ignored rather than causing a failure, whatever the
      capitalisation of the file extension.
    ● The records must come back in a stable, predictable order, so rerunning the indexing produces the same records in the
      same sequence.
    ● Each record must hold exactly two keys, document_name with the bare file name rather than a full path, and
      document_text with the full text from extract_text_from_pdf.
    ● Every document in the corpus must yield some text, since a document that produces nothing can never be retrieved.
RETURNS
A list of one record per document, each holding the file name and its full text.



MODULE: knowledge/chunk_splitting.py
A whole manual is too long to hand to a language model, and searching it as one block returns the whole manual for every
question. This module cuts each document into short overlapping pieces so that a search returns just the relevant paragraph, and
labels every piece with where it came from so the answer can be traced back to a real document.

FUNCTION SIGNATURE
split_text_into_chunks(document_text, chunk_size, chunk_overlap)
PARAMETERS
document_text — The full text of one document, as produced by extract_text_from_pdf.
chunk_size — A whole number of characters, the size a piece should be, passed in as config.CHUNK_SIZE_CHARACTERS.
chunk_overlap — A whole number of characters that consecutive pieces share, passed in as
config.CHUNK_OVERLAP_CHARACTERS.
PURPOSE
Cut one document into overlapping pieces short enough to be retrieved and read individually.
REQUIREMENTS
    ● No piece may be longer than chunk_size characters, and no piece may be empty or hold only whitespace.
    ● Consecutive pieces must share chunk_overlap characters of text, so the pieces together add up to more characters than
      document_text.
    ● A long document_text must yield more than one piece, and the pieces together must cover it from beginning to end with
      nothing dropped.
    ● Line breaks and runs of repeated whitespace must be collapsed into single spaces in the stored pieces, and splitting the
      same text twice must produce exactly the same pieces.
RETURNS
A list of text pieces in the order they appear in the document.

FUNCTION SIGNATURE
build_chunk_records(document_entries, chunk_size, chunk_overlap)
PARAMETERS
document_entries — The list of per-document records returned by extract_text_from_directory.


chunk_size — A whole number of characters, passed in as config.CHUNK_SIZE_CHARACTERS.
chunk_overlap — A whole number of characters, passed in as config.CHUNK_OVERLAP_CHARACTERS.
PURPOSE
Cut every document into pieces using split_text_into_chunks and label each piece with the document and the position it came
from.
REQUIREMENTS
    ● Each record must hold exactly four keys: chunk_id, chunk_text, document_name and chunk_position.
    ● chunk_id must be unique across the entire corpus, combining the source document with the position inside that
      document.
    ● chunk_position must record where the piece sits in its own document, counted from the start of that document rather than
      continuing across documents.
    ● document_name must carry through unchanged from the record produced by extract_text_from_directory, and the records
      must come back in a stable order across rebuilds.
RETURNS
A flat list of labelled chunk records covering every document.



MODULE: knowledge/vector_index.py
This module builds the searchable knowledge store, the write side of the maintenance knowledge base. Each chunk of manual
text is stored beside a numeric description of what it means, so that a later search can match on meaning rather than on shared
words: a question about a grinding noise finds a bearing procedure even where the manual never uses the word grinding. It is the
only place the store is created and filled.

FUNCTION SIGNATURE
load_embedding_model(model_name, device_name)
PARAMETERS
model_name — Text. The name of the meaning model to load, passed in as config.EMBEDDING_MODEL_NAME.
device_name — Text. The hardware the model runs on, passed in as config.EMBEDDING_DEVICE.
PURPOSE
Load the local model that converts a piece of text into the numbers describing its meaning.
REQUIREMENTS
    ● The model must be fetched a single time and cached locally, with a later call reusing the cached copy rather than
      downloading again.
    ● The very same model named by config.EMBEDDING_MODEL_NAME must serve both the building of the index and the
      searching of it, as numbers from two different models describe meaning on different scales.
    ● The model must arrive ready to use, with no training happening here.
RETURNS
The loaded meaning model.

FUNCTION SIGNATURE
create_embedding_vectors(embedding_model, text_list)
PARAMETERS
embedding_model — The model returned by load_embedding_model.
text_list — A list of strings to convert, every chunk's text when building the index and a single-item list holding the question when
searching.
PURPOSE
Turn a list of texts into the lists of numbers that describe their meaning.
REQUIREMENTS
    ● One numeric description must come back per input text, in the same order as text_list, so a description can always be
      matched to the text it came from.
    ● The result must be plain lists of ordinary numbers, the form the store accepts and the search step passes around.
    ● The whole of text_list must be converted in one call rather than one text at a time.
    ● Progress output must stay suppressed, as this runs on every search inside a running service.
RETURNS
A list of numeric meaning descriptions, one per input text.

FUNCTION SIGNATURE
create_vector_collection(store_path, collection_name)
PARAMETERS
store_path — Text. The folder the knowledge store is kept in, passed in as config.VECTOR_STORE_DIRECTORY.
collection_name — Text. The name of the collection, passed in as config.VECTOR_COLLECTION_NAME.
PURPOSE
Create an empty collection to hold the corpus, replacing any collection of the same name that already exists.
REQUIREMENTS
    ● The store must sit on disk under store_path and survive the process ending, since the API service and the agents open it in
      a separate run.
    ● An existing collection named collection_name must be replaced rather than added to, so a rerun of the indexing script
      never leaves a chunk stored twice.


    ● Closeness must be judged by the direction of two meanings rather than by their magnitude, so a value near 0 means two
      texts mean nearly the same thing whatever their length.
    ● The collection must come back empty.
RETURNS
The new empty collection.

FUNCTION SIGNATURE
add_chunks_to_collection(collection, chunk_records, chunk_vectors)
PARAMETERS
collection — The empty collection returned by create_vector_collection.
chunk_records — The labelled chunk records returned by build_chunk_records.
chunk_vectors — The numeric meaning descriptions returned by create_embedding_vectors, one per record and in the same
order.
PURPOSE
Store every chunk in the collection together with its text, its meaning description and the source details needed to cite it.
REQUIREMENTS
    ● Every record in chunk_records must be stored, with the count held by the collection afterwards equal to the number of
      records handed in.
    ● Each record must keep its own description from chunk_vectors, position for position, since a single position out of step
      attaches every chunk to the wrong meaning and fails silently.
    ● The chunk_id of each record must become the stored identifier and chunk_text the retrievable text.
    ● Both document_name and chunk_position must be stored alongside each chunk as attached details, so a retrieved chunk
      can be traced back to a document.
RETURNS
The number of chunks now held in the collection.

FUNCTION SIGNATURE
build_knowledge_index(docs_directory, store_path)
PARAMETERS
docs_directory — Text. The folder holding the maintenance corpus, passed in as config.DOCS_DIRECTORY.
store_path — Text. The folder the knowledge store is written to, passed in as config.VECTOR_STORE_DIRECTORY.
PURPOSE
Run the whole indexing workflow, from the documents in docs_directory through to labelled chunks stored under store_path with
a meaning description each.
REQUIREMENTS
    ● The chunking must use config.CHUNK_SIZE_CHARACTERS and config.CHUNK_OVERLAP_CHARACTERS, and the
      meaning model must be loaded with config.EMBEDDING_MODEL_NAME and config.EMBEDDING_DEVICE, so indexing
      and searching agree.
    ● The collection must carry the name config.VECTOR_COLLECTION_NAME that knowledge/procedure_retrieval.py later
      opens.
    ● Rerunning this function must leave the store holding exactly one copy of each chunk.
    ● The count of documents read and the count of chunks created must appear in the run log, and the chunk count must equal
      the number of chunks that splitting the corpus produces.
RETURNS
The number of chunks stored.



MODULE: knowledge/procedure_retrieval.py
This module is the read side of the maintenance knowledge base. It opens the store that run_knowledge_indexing.py built, finds
the passages whose meaning is closest to a question, and lays them out as one attributed block of text. The Procedure Advisor
agent writes its answer using only what comes back from here, so every instruction it gives can be traced to a real manual.

FUNCTION SIGNATURE
open_vector_collection(store_path, collection_name)
PARAMETERS
store_path — Text. The folder the knowledge store lives in, passed in as config.VECTOR_STORE_DIRECTORY.
collection_name — Text. The name of the collection to open, passed in as config.VECTOR_COLLECTION_NAME.
PURPOSE
Open the already-built collection so it can be searched.
REQUIREMENTS
    ● The existing collection named collection_name must be opened, never created or emptied, and a collection that does not
      exist must surface as an error the caller sees.
    ● The collection must be read from disk under store_path, written by a previous run of the indexing entry point.
RETURNS
The opened collection, ready to be searched.

FUNCTION SIGNATURE
retrieve_relevant_chunks(collection, query_vector, result_count)


PARAMETERS
collection — The collection returned by open_vector_collection.
query_vector — The numeric meaning description of the question, produced by create_embedding_vectors from the same model
that built the index, never raw text.
result_count — A whole number, how many passages to return, passed in as config.RETRIEVAL_RESULT_COUNT.
PURPOSE
Return the stored passages whose meaning sits closest to the question.
REQUIREMENTS
    ● Exactly result_count passages must come back when the store holds at least that many.
    ● The results must be ordered from closest to furthest, so the strongest match sits at the top.
    ● Each result must be a record with exactly four keys: chunk_id, chunk_text, document_name read back from the details
      stored with the chunk, and distance, a plain number shortened to a few decimal places that is smaller for a closer match.
    ● Matching must be on meaning rather than shared words, so a question about a grinding noise from a pump reaches a
      bearing procedure that never uses that wording, and two questions on different subjects do not return the same document
      at the top.
RETURNS
A list of matching passage records ordered from closest to furthest.

FUNCTION SIGNATURE
format_retrieved_context(retrieved_chunks)
PARAMETERS
retrieved_chunks — The list of matching passage records returned by retrieve_relevant_chunks.
PURPOSE
Lay the retrieved passages out as one block of text an agent can read in a single prompt.
REQUIREMENTS
    ● Every passage must be attributed to the document it came from, marked clearly enough that an agent reading the block
      can tell which manual each instruction belongs to and cite it.
    ● Passages must appear in the order they were given, each clearly separated from the one that follows rather than running
      together into one paragraph.
    ● The passage text must be reproduced exactly as stored, with nothing summarised, shortened or reworded.
    ● An empty retrieved_chunks must produce an empty block rather than raising.
RETURNS
One block of text holding every retrieved passage with its source.

============== AGENT TOOLS AND PERSISTENCE ==============


========= GROUP: AGENT TOOLS ==========


MODULE: tools/machine_data_tools.py
This module answers factual questions about a single machine by reading the live current fleet and the cleaned technician note
history. Nothing here calls a language model and nothing here predicts anything, so the same machine tag always produces the
same answer. The current fleet is deliberately a different file from the evaluation set, because the evaluation set carries the
answer column the project is meant to predict and an application must never be handed that column.

FUNCTION SIGNATURE
load_current_fleet(fleet_file_path)
PARAMETERS
fleet_file_path — Text. The path of the live fleet file, config.CURRENT_FLEET_FILE.
PURPOSE
Read the current condition of every machine in the fleet into one table that the rest of the application can query.
REQUIREMENTS
    ● The table must carry one row for each machine in the file, with column types resolved as they are for any other cleaned file
      rather than left as raw text.
    ● The table must be produced by the shared cleaned-file reader load_processed_dataset in data_pipeline/dataset_loader.py.
    ● No column may be added, renamed, dropped or reordered.
RETURNS
A table of the live fleet, one row per machine.

FUNCTION SIGNATURE
fetch_machine_profile(fleet_frame, machine_code)
PARAMETERS
fleet_frame — A table of the live fleet, from load_current_fleet.
machine_code — Text. The tag of the machine being asked about, matched against the machine_code column.
PURPOSE
Return the current condition of one named machine as a single flat record that can be handed to a model or shown to an agent.
REQUIREMENTS
    ● The record must carry every column of the current fleet as a key, spelled exactly as the column is spelled, holding that
      machine's value.


    ● The machine_code value in the record must equal the tag asked for.
    ● A tag that is not present in the fleet must give an empty record rather than an error, an invented record or the record of a
      neighbouring machine.
    ● fleet_frame must be left unmodified by the lookup.
RETURNS
A record of one machine's current condition, keyed by column name, or an empty record when the tag is unknown.

FUNCTION SIGNATURE
fetch_machine_note_history(notes_frame, machine_code)
PARAMETERS
notes_frame — A table of cleaned technician notes, read by load_processed_dataset in data_pipeline/dataset_loader.py from
config.CLEAN_TECHNICIAN_NOTES_FILE.
machine_code — Text. The tag of the machine being asked about, matched against the machine_code column.
PURPOSE
Return the full written history of one machine, so that its problem type can be judged from everything technicians have ever
recorded about it rather than from its latest reading alone.
REQUIREMENTS
    ● Only notes belonging to the named machine may appear, and every one of that machine's notes must appear.
    ● The history must run from oldest to newest by the note_date column.
    ● Each entry must be the plain text of the note_text column as text, not a record and not a row.
    ● A machine with no notes must give an empty history rather than an error.
RETURNS
A list of note texts for that machine, ordered from oldest to newest, empty when the machine has no notes.



MODULE: tools/prediction_tools.py
This module runs the three trained models and applies the written business rules from the MHI policy documents. Every answer it
produces is a number or a table lookup, arrived at the same way every time; the agents read these answers and explain them, and
are never permitted to work them out or overrule them. Nothing here trains a model, and nothing here silently supplies a value
that the source data failed to provide.

FUNCTION SIGNATURE
build_model_input_row(record_dictionary, feature_names)
PARAMETERS
record_dictionary — A flat record of one thing to be scored: a machine profile from fetch_machine_profile, or a planned job
record from build_planned_repair_record.
feature_names — A list of feature column names in the exact order the model was trained on, from load_feature_schema in
modeling/model_registry.py.
PURPOSE
Turn one record into the single row of input a saved model expects, carrying exactly the schema columns in exactly the schema
order.
REQUIREMENTS
    ● The row must hold precisely the names listed in feature_names, in that same order, and nothing else.
    ● The result must be exactly one row.
    ● A name listed in feature_names that record_dictionary does not carry must stop the run with an error naming every
      missing feature.
    ● A missing feature may not be filled with an empty value, a zero or any other default.
RETURNS
A one-row input carrying the schema columns in schema order.

FUNCTION SIGNATURE
predict_breakdown_probability(breakdown_model, feature_row)
PARAMETERS
breakdown_model — The trained breakdown risk model, from load_model_artifact in modeling/model_registry.py reading
config.BREAKDOWN_MODEL_FILE.
feature_row — A one-row model input from build_model_input_row, built against the breakdown risk schema.
PURPOSE
Report the chance that one machine breaks down within thirty days.
REQUIREMENTS
    ● The value must be the chance of the breakdown outcome, not the chance of the machine staying healthy, and not a bare
      yes-or-no label.
    ● The value must be a single plain number between 0 and 1 inclusive, rounded to 4 decimal places.
    ● Scoring the same row twice must give exactly the same number.
RETURNS
One probability between 0 and 1.

FUNCTION SIGNATURE
classify_risk_band(breakdown_probability, risk_thresholds)


PARAMETERS
breakdown_probability — A number between 0 and 1, from predict_breakdown_probability.
risk_thresholds — A record of the two cut-offs, carrying the key "high" set from config.HIGH_RISK_THRESHOLD and the key
"medium" set from config.MEDIUM_RISK_THRESHOLD. These two key names are fixed; callers build this record.
PURPOSE
Place a probability into the config.RISK_BAND_HIGH, config.RISK_BAND_MEDIUM or config.RISK_BAND_LOW band that Policy
01 works in.
REQUIREMENTS
    ● The cut-offs must be taken from risk_thresholds rather than reached for directly in the configuration.
    ● Both boundaries are inclusive at the lower edge, so a probability equal to a cut-off belongs to the higher band.
    ● The answer must always be one of config.RISK_BAND_HIGH, config.RISK_BAND_MEDIUM or config.RISK_BAND_LOW,
      never a band name written out by hand.
    ● Every probability from 0 to 1 must receive a band, with no fourth outcome and no unbanded case.
RETURNS
One risk band name.

FUNCTION SIGNATURE
resolve_repair_priority(importance, risk_band)
PARAMETERS
importance — Text. The importance class of the machine, taken from the importance field of the record returned by
fetch_machine_profile.
risk_band — Text. The band from classify_risk_band.
PURPOSE
Look up the repair job priority that Policy 01 assigns to this combination of machine importance and risk band.
REQUIREMENTS
    ● The priority must be the value config.PRIORITY_MATRIX holds for the pair of importance and band together, never one
      reasoned out, recomputed or hard-coded.
    ● A pair that config.PRIORITY_MATRIX does not hold must stop the run with an error naming the pair rather than yield a
      priority.
RETURNS
One repair job priority code.

FUNCTION SIGNATURE
detect_problem_type(problem_type_model, text_vectorizer, note_history)
PARAMETERS
problem_type_model — The trained problem type classifier, from load_model_artifact reading
config.PROBLEM_TYPE_MODEL_FILE.
text_vectorizer — The fitted text vectorizer saved alongside it, from load_model_artifact reading config.TEXT_VECTORIZER_FILE.
It must be the same one the classifier was fitted with.
note_history — A list of note texts for one machine, ordered from oldest to newest, from fetch_machine_note_history.
PURPOSE
Read every past note written about a machine and report the problem type those notes point to, together with how strongly they
agree.
REQUIREMENTS
    ● The record must carry exactly the keys "problem_type", "confidence", "note_count" and "problem_votes".
    ● "problem_votes" must map each predicted mode to the number of notes that voted for it, those counts must add up to the
      number of notes supplied, and "note_count" must equal that same number.
    ● "problem_type" must be the mode with the most votes, settled in favour of the mode appearing earlier in note_history
      when two modes tie, and "confidence" must be its share of the notes rounded to 4 decimal places.
    ● An empty note_history must give the same four keys with empty text as the mode, a confidence of 0.0, a count of 0 and no
      votes, rather than an error or a guessed mode.
RETURNS
A record of the detected problem type, its confidence, the note count and the vote tally.

FUNCTION SIGNATURE
score_current_fleet(breakdown_model, fleet_frame, feature_names)
PARAMETERS
breakdown_model — The trained breakdown risk model, from load_model_artifact reading config.BREAKDOWN_MODEL_FILE.
fleet_frame — A table of the live fleet, from load_current_fleet.
feature_names — The breakdown risk feature schema, from load_feature_schema reading config.BREAKDOWN_SCHEMA_FILE.
PURPOSE
Score the whole fleet in a single pass and hand back the same table ordered worst to best, so a control room view of every
machine costs one scoring pass rather than one per machine.
REQUIREMENTS
    ● The result must carry one row for every machine in fleet_frame, keeping all of its original columns unchanged, and must
      add exactly three: breakdown_probability, risk_band and priority.
    ● breakdown_probability must be the chance of the breakdown outcome for that row, rounded to 4 decimal places and
      within 0 to 1.


    ● risk_band must equal what classify_risk_band gives for that row's probability against config.HIGH_RISK_THRESHOLD and
      config.MEDIUM_RISK_THRESHOLD, and priority must equal what resolve_repair_priority gives for that row's importance
      value and that band.
    ● Rows must be ordered by breakdown_probability from highest to lowest, and fleet_frame itself must be left untouched.
RETURNS
The fleet table with the three added columns, ordered from highest to lowest breakdown_probability.

FUNCTION SIGNATURE
build_planned_repair_record(machine_profile, risk_facts, job_context)
PARAMETERS
machine_profile — The current condition of one machine, from fetch_machine_profile.
risk_facts — A record of the risk findings for that machine, carrying the keys "breakdown_probability", "risk_band" and "priority".
Callers assemble it from predict_breakdown_probability, classify_risk_band and resolve_repair_priority.
job_context — A record describing the job being planned, carrying the keys "problem_type" and "access_level". The problem type
comes from detect_problem_type; the access difficulty is one of config.ACCESS_LEVEL_OPTIONS and is stated by whoever
raises the request.
PURPOSE
Describe a repair that has not happened yet in the shape the downtime model expects, so a job with no recorded crew, shift or
parts can still be costed.
REQUIREMENTS
    ● The record must carry every key the downtime feature schema lists, including every key of
      config.REPAIR_JOB_PLANNING_ASSUMPTIONS holding the value that constant gives.
    ● machine_type, manufacturer, factory_name, production_line, importance, usage_pattern, power_rating_kw and
      machine_age_months must hold the values of the same names in machine_profile, and repairs_last_year must hold the
      breakdowns_last_year value of machine_profile.
    ● problem_type and access_level must hold the job_context values, priority the risk_facts value, and severity the code
      config.SEVERITY_BY_RISK_BAND gives for the "risk_band" in risk_facts.
    ● Every value must be read straight from the record supplied with no fallback and no default, and a supplied record missing
      one of the fields read must stop the run rather than give a partly filled job.
RETURNS
A flat record of the planned job, ready to be turned into a downtime model input.

FUNCTION SIGNATURE
estimate_repair_downtime(downtime_model, feature_row)
PARAMETERS
downtime_model — The trained downtime model, from load_model_artifact reading config.DOWNTIME_MODEL_FILE.
feature_row — A one-row model input from build_model_input_row, built from a planned job record against the downtime
schema.
PURPOSE
Report how many hours the machine is expected to be out of service for this repair.
REQUIREMENTS
    ● The value must be a single plain number of hours, rounded to 2 decimal places, not a one-element collection.
    ● The value must be the model's own unadjusted output, with the tight space allowance left out of it.
RETURNS
The estimated out-of-service duration in hours.

FUNCTION SIGNATURE
apply_tight_space_factor(estimated_hours, access_level)
PARAMETERS
estimated_hours — A number of hours, from estimate_repair_downtime.
access_level — Text. How hard the job is to reach, one of config.ACCESS_LEVEL_OPTIONS.
PURPOSE
Stretch a duration estimate for work inside a tight space, which Safety Rule 03 makes slower by requiring forced ventilation,
repeated gas testing and a standby attendant who does no work.
REQUIREMENTS
    ● A duration whose access_level equals config.ACCESS_LEVEL_TIGHT_SPACE must be scaled by
      config.TIGHT_SPACE_DURATION_FACTOR.
    ● Every other entry of config.ACCESS_LEVEL_OPTIONS must leave the duration unchanged in value, neither stretched,
      shortened nor rounded away.
    ● The value must be a plain number of hours rounded to 2 decimal places whether or not the allowance applied.
RETURNS
The duration in hours, stretched only for tight space work.



MODULE: tools/retrieval_tools.py
This module searches the indexed maintenance manuals, standards and policies and returns what they actually say. It returns
manual text exactly as written, with the documents it came from recorded alongside it, so that every instruction the Procedure


Advisor agent later gives can be traced back to a real document. No language model is called here and no text is summarised or
paraphrased.

FUNCTION SIGNATURE
open_manual_search(store_path, collection_name)
PARAMETERS
store_path — Text. Where the vector store lives, config.VECTOR_STORE_DIRECTORY.
collection_name — Text. The name of the indexed collection inside it, config.VECTOR_COLLECTION_NAME.
PURPOSE
Open the indexed document store and load the model that searches it, and hand both back together as one searchable handle.
REQUIREMENTS
    ● The handle must carry exactly the keys "collection" and "embedding_model".
    ● "collection" must be the collection run_knowledge_indexing.py already built, opened through open_vector_collection in
      knowledge/procedure_retrieval.py, with nothing indexed or re-indexed here.
    ● "embedding_model" must be the model load_embedding_model in knowledge/vector_index.py gives for
      config.EMBEDDING_MODEL_NAME on config.EMBEDDING_DEVICE, which is the model that built the index.
    ● Both must be opened a single time and held in the handle for the life of the service, rather than reopened per search.
RETURNS
A search handle carrying the opened collection and the loaded embedding model.

FUNCTION SIGNATURE
lookup_repair_procedure(manual_search, machine_type, problem_type)
PARAMETERS
manual_search — A search handle, from open_manual_search.
machine_type — Text. The kind of machine, taken from the machine_type field of the record returned by fetch_machine_profile.
problem_type — Text. The kind of failure, taken from the "problem_type" key of the record returned by detect_problem_type.
PURPOSE
Find the passages of the manuals that describe how to repair this kind of failure on this kind of machine, and the parts, permit
and torque figures that go with it.
REQUIREMENTS
    ● The record must carry exactly the keys "question_text", "context_text", "source_documents" and "chunk_count".
    ● "question_text" must be the plain-language sentence actually put to the store, naming the problem type and the machine
      type and asking for the repair procedure, the required permit, the parts and the torque values, rather than a keyword list.
    ● "context_text" must be exactly config.RETRIEVAL_RESULT_COUNT passages, matched by retrieve_relevant_chunks in
      knowledge/procedure_retrieval.py against the question turned into numbers by create_embedding_vectors in
      knowledge/vector_index.py with the handle's embedding model, laid out as one readable block by
      format_retrieved_context with each passage labelled by its document and none reworded, shortened or merged.
    ● "source_documents" must name each contributing document a single time in the order the documents appear among the
      passages, and "chunk_count" must be the number of passages actually retrieved.
RETURNS
A record of the question asked, the retrieved manual text, the documents it came from and how many passages were used.

FUNCTION SIGNATURE
lookup_safety_requirement(manual_search, machine_type)
PARAMETERS
manual_search — A search handle, from open_manual_search.
machine_type — Text. The kind of machine, taken from the machine_type field of the record returned by fetch_machine_profile.
PURPOSE
Find the permit, isolation and tight space rules that must be satisfied before this kind of machine is opened up.
REQUIREMENTS
    ● The record must carry exactly the same four keys as lookup_repair_procedure — "question_text", "context_text",
      "source_documents" and "chunk_count" — with the same meanings.
    ● "question_text" must be the plain-language sentence actually put to the store, about the lockout tagout permit, the
      isolation steps and the tight space rules for working on the given machine_type.
    ● "context_text" must be exactly config.RETRIEVAL_RESULT_COUNT passages found with the handle's embedding model,
      labelled with their source documents and otherwise unaltered, and "source_documents" must name each contributing
      document a single time in the order the documents appear.
    ● The result must come from a search of its own rather than a filter over the procedure results, so a safety rule living in a
      document the procedure search never touched is still found.
RETURNS
A record of the question asked, the retrieved safety text, the documents it came from and how many passages were used.

=========== GROUP: PERSISTENCE ==========


MODULE: persistence/database.py
This module owns the single connection to the application database named by config.APPLICATION_DATABASE_URL, hands out
the sessions every other module works through, and creates the tables. It must expose that connection and its supporting
objects under the module level names DATABASE_URL, engine, SessionLocal and Base, because run_database_setup.py imports


the connection directly and the table definitions register themselves against Base. It stores what the agents produce — advisory
runs, drafted repair jobs, supervisor decisions and the language model call log — and holds no business logic of its own.

FUNCTION SIGNATURE
get_database_session()
PARAMETERS
This function takes no parameters.
PURPOSE
Supply one database session to a single web request and guarantee it is closed again afterwards.
REQUIREMENTS
     ● Each request must work with a session of its own, never one shared with another request.
     ● The session must be closed when the request that borrowed it has finished, whether that request succeeded or failed,
       without the endpoint having to close it.
     ● The connection this module opens must tolerate being used from more than one thread.
RETURNS
One session, lent for the duration of a single request and closed afterwards.

FUNCTION SIGNATURE
open_database_session()
PARAMETERS
This function takes no parameters.
PURPOSE
Give one database session to code running outside the web service, such as the setup scripts and the workflow nodes.
REQUIREMENTS
     ● The session must be handed straight to the caller, which owns it and is responsible for closing it.
     ● The session must come from the same shared factory SessionLocal that the request-scoped sessions come from, so the
       whole project talks to one database through one connection pool.
RETURNS
One open database session.

FUNCTION SIGNATURE
create_database_directory(directory_path)
PARAMETERS
directory_path — Text. The folder that will hold the database file, config.DATABASE_DIRECTORY.
PURPOSE
Make sure the folder the database file lives in exists before anything tries to write to it.
REQUIREMENTS
     ● A folder that is already there must be left exactly as it is, with no error raised and no contents disturbed, so repeated runs
       of the setup script are safe.
     ● Any missing parent folder on the path must exist afterwards.
     ● The path handed in must be the path handed back.
RETURNS
The folder path.

FUNCTION SIGNATURE
create_all_tables(database_engine)
PARAMETERS
database_engine — A database connection to create the tables on. The setup script passes this module's own connection; other
callers may pass a connection to a different database file.
PURPOSE
Create every table the project writes to on the given connection and report what the database now holds.
REQUIREMENTS
     ● Every table defined in persistence/models.py must exist on database_engine afterwards, which requires that module to
       have been read so its definitions register themselves.
     ● The reading of persistence/models.py must be arranged so that no circular dependency arises between it and this
       module, which depends on this one for its shared Base.
     ● Tables that already exist must be left intact with their rows untouched, and repeated runs must be safe.
     ● Creation must target database_engine rather than this module's own engine, and the names returned must be read back
       from that database itself rather than listed from memory.
RETURNS
A list of the table names now present in that database.



MODULE: persistence/models.py
This module defines every table the application database holds, and nothing else. Four of them are specified here, and between
them they record one advisory run, the repair jobs that run drafted, the supervisor decisions taken against them, and every
language model call the run made, which together form the audit trail an engineering organisation needs when a machine is
taken out of service. Two more belong to capabilities specified later, the account table under ACCESS CONTROL and the chat log


under MANUAL CHAT, and both are defined in this same module alongside these four, so the whole database is described by one
file. Each table's column names are read by name across the repository, the web service and the dashboard, so they are a data
contract and must be spelled exactly as given.

TABLE
agent_runs
CLASS
AgentRun
PURPOSE
One row for each execution of the multi-agent advisory workflow.
COLUMNS
    ● id — number; the automatically assigned primary key of the row.
    ● run_id — text; the business identifier of this run, unique across the table and the value every other table refers back to.
    ● thread_id — text; the workflow conversation this run belongs to, used to resume a run that is paused waiting for a
      supervisor.
    ● machine_code — text; the machine the advisory was requested about.
    ● request_text — text; the request as the requester wrote it.
    ● status — text; where the run has got to, one of config.AGENT_RUN_STATUS_RUNNING,
      config.AGENT_RUN_STATUS_AWAITING_REVIEW and config.AGENT_RUN_STATUS_COMPLETE.
    ● started_at — timestamp; when the run was opened, stamped automatically as the row is created.
    ● completed_at — timestamp; when the run finished, and empty until it has.

TABLE
repair_jobs
CLASS
RepairJobDraft
PURPOSE
One row for each repair job the agents produced, holding both the drafted version and, after review, the approved one.
COLUMNS
    ● id — number; the automatically assigned primary key of the row.
    ● repair_job_id — text; the business identifier of this repair job, unique across the table.
    ● run_id — text; the advisory run that produced it, tying back to agent_runs.run_id.
    ● machine_code — text; the machine the work is on.
    ● machine_type — text; the kind of machine it is.
    ● breakdown_probability — number; the chance of breakdown the risk model reported.
    ● risk_band — text; the band that probability falls into.
    ● problem_type — text; the problem type the note history points to.
    ● priority — text; the priority config.PRIORITY_MATRIX assigned.
    ● estimated_downtime_hours — number; the out-of-service duration expected, after any tight space allowance.
    ● permit_required — text; the permit the manuals say the job needs.
    ● procedure_reference — text; the procedure the work follows.
    ● parts_required — text; the parts the job calls for.
    ● task_steps — text; the steps the technician is to carry out.
    ● safety_notes — text; the safety instructions attached to the job.
    ● proposed_window — text; the shutdown window the work is proposed for.
    ● source_documents — text; the manuals the procedure was taken from, kept so any instruction on the repair job can be
      traced back to the document it came from.
    ● job_summary — text; the plain summary of what the job is and why it is being raised.
    ● scheduling_note — text; the note on when and how the work should be slotted in.
    ● changes_applied — text; what the finalizer altered after review, empty until a supervisor has decided, so the audit trail
      keeps the draft and the approved version distinguishable.
    ● status — text; where the repair job stands, one of config.REPAIR_JOB_STATUS_OPTIONS.
    ● created_at — timestamp; when the draft was saved, stamped automatically as the row is created.

TABLE
review_decisions
CLASS
ReviewDecision
PURPOSE
One row for each decision a maintenance supervisor recorded against a drafted repair job.
COLUMNS
    ● id — number; the automatically assigned primary key of the row.
    ● run_id — text; the advisory run being decided, tying back to agent_runs.run_id.
    ● repair_job_id — text; the repair job the decision is about.
    ● decision — text; what was decided, one of config.REVIEW_DECISION_OPTIONS, namely
      config.REVIEW_DECISION_APPROVE, config.REVIEW_DECISION_MODIFY or config.REVIEW_DECISION_REJECT.
    ● reviewer_name — text; who decided, so that somebody is accountable for the decision.


     ● feedback_text — text; what the reviewer wrote alongside the decision.
     ● reviewed_draft — text; the wording that was in front of the reviewer at the moment of deciding, kept so a later rewrite
       cannot change what was approved.
     ● decided_at — timestamp; when the decision was taken, stamped automatically as the row is created.

TABLE
llm_calls
CLASS
LlmCallRecord
PURPOSE
One row for each language model call a single agent made during a run.
COLUMNS
     ● id — number; the automatically assigned primary key of the row.
     ● run_id — text; the advisory run that made the call, tying back to agent_runs.run_id.
     ● agent_name — text; which agent made it, one of the agent names config defines.
     ● model_name — text; which language model answered, taken from config.GEMINI_MODEL_NAME.
     ● prompt_characters — number; how much text was sent.
     ● response_characters — number; how much text came back.
     ● latency_milliseconds — number; how long the call took.
     ● called_at — timestamp; when the call was made, stamped automatically as the row is created.



MODULE: persistence/repository.py
This module holds every save and read the application performs against those tables, and is the only place that touches them.
Every function is handed an already open session, so the code that calls it decides when a session is opened and closed, and no
function here opens or closes one itself. Rows are handed back as plain flat records rather than table rows, so the web service
and the dashboard never depend on the shape of the tables.

FUNCTION SIGNATURE
insert_agent_run(session, run_record)
PARAMETERS
session — An open database session, from get_database_session or open_database_session.
run_record — A flat record of the run to save, carrying at least the keys "run_id", "thread_id", "machine_code", "request_text" and
"status".
PURPOSE
Record that an advisory run has been opened, before any agent work begins.
REQUIREMENTS
     ● Only the keys "run_id", "thread_id", "machine_code", "request_text" and "status" may be taken from run_record, and a record
       carrying extra keys must save cleanly with the extras ignored rather than fail or write them.
     ● started_at must be stamped by the database as the row is created, and completed_at must be left empty.
     ● The saved row must be re-read from the database so that anything the database filled in is available to the caller.
     ● The save must be complete and visible to any later read through any session by the time the function returns.
RETURNS
The run_id of the saved run.

FUNCTION SIGNATURE
update_agent_run_status(session, run_id, status_value)
PARAMETERS
session — An open database session.
run_id — Text. The run to change, matched against the run_id column.
status_value — Text. The new status, one of the run status values config defines.
PURPOSE
Move a saved run to a new status as it progresses from running, through awaiting review, to complete.
REQUIREMENTS
     ● Exactly one run may be matched, by its run_id, and a run id that is not in the table must stop the caller with an error naming
       that id rather than silently do nothing.
     ● completed_at may be stamped only when status_value is config.AGENT_RUN_STATUS_COMPLETE.
     ● No field of the run other than status and completed_at may be altered.
     ● The change must be complete and visible to a later read by the time the function returns.
RETURNS
The run_id of the run that was changed.

FUNCTION SIGNATURE
apply_review_outcome(session, repair_job_id, final_repair_job)
PARAMETERS
session — An open database session.
repair_job_id — Text. The repair job to overwrite, matched against the repair_job_id column.


final_repair_job — A flat record of the finalised repair job, from which the keys "job_summary", "task_steps", "changes_applied"
and "status" are read.
PURPOSE
Replace a drafted repair job with the version the finalizer agent produced after the supervisor's decision.
REQUIREMENTS
    ● Only job_summary, task_steps, changes_applied and status may be written back, holding the final_repair_job values.
    ● breakdown_probability, risk_band, priority, estimated_downtime_hours, procedure_reference, parts_required,
      safety_notes and source_documents must keep exactly the values the models and the manuals produced, so nobody can
      quietly rewrite the evidence during review.
    ● A repair_job_id that is not in the table must stop the caller with an error naming that id.
    ● The change must be complete and visible to a later read by the time the function returns.
RETURNS
The repair_job_id of the repair job that was updated.

FUNCTION SIGNATURE
fetch_agent_run(session, run_id)
PARAMETERS
session — An open database session.
run_id — Text. The run being asked about.
PURPOSE
Read one advisory run back as a plain record for the web service and the audit trail.
REQUIREMENTS
    ● The record must carry exactly the keys "run_id", "thread_id", "machine_code", "request_text", "status", "started_at" and
      "completed_at".
    ● "started_at" and "completed_at" must both be given as text.
    ● A run that has not finished must carry empty text under "completed_at" rather than a missing key or a placeholder date.
    ● A run id that is not in the table must give an empty record rather than an error.
RETURNS
A record of one run, or an empty record when the run id is unknown.

FUNCTION SIGNATURE
insert_repair_job_draft(session, repair_job_record)
PARAMETERS
session — An open database session.
repair_job_record — A flat record of the drafted repair job, carrying the keys "repair_job_id", "run_id", "machine_code",
"machine_type", "breakdown_probability", "risk_band", "problem_type", "priority", "estimated_downtime_hours", "permit_required",
"procedure_reference", "parts_required", "task_steps", "safety_notes", "proposed_window", "source_documents", "job_summary",
"scheduling_note" and "status".
PURPOSE
Save a repair job the agents have drafted, so that it exists on the record before a supervisor is asked to decide on it.
REQUIREMENTS
    ● Every one of those keys must reach its matching column, and every value must come back unchanged when the repair job
      is read again.
    ● changes_applied must be empty on a newly saved draft, whatever the supplied record happens to carry.
    ● created_at must be stamped by the database as the row is created, a creation time carried in the record must be ignored,
      and the stamped row must be re-read so anything the database filled in is available.
    ● A record carrying extra keys must save cleanly with the extras ignored, and the save must be complete and visible to a
      later read by the time the function returns.
RETURNS
The repair_job_id of the saved draft.

FUNCTION SIGNATURE
update_repair_job_status(session, repair_job_id, status_value)
PARAMETERS
session — An open database session.
repair_job_id — Text. The repair job to change.
status_value — Text. The new status, one of config.REPAIR_JOB_STATUS_OPTIONS.
PURPOSE
Move a saved repair job to a new status, which is how a rejected draft is closed without any of its wording being touched.
REQUIREMENTS
    ● Exactly one repair job may be matched, by its repair_job_id.
    ● An id that is not in the table must stop the caller with an error naming that id.
    ● No field other than status may change, leaving a rejected draft on the record exactly as the agents wrote it.
    ● The change must be complete and visible to a later read by the time the function returns.
RETURNS
The repair_job_id of the repair job that was changed.

FUNCTION SIGNATURE


build_repair_job_dictionary(repair_job_row)
PARAMETERS
repair_job_row — One saved repair job row, as read from the repair_jobs table by the other functions in this module.
PURPOSE
Translate one stored repair job into the flat record every other layer of the project reads, so that nothing outside this module
depends on the table's shape.
REQUIREMENTS
     ● The record must carry exactly the keys "repair_job_id", "run_id", "machine_code", "machine_type", "breakdown_probability",
       "risk_band", "problem_type", "priority", "estimated_downtime_hours", "permit_required", "procedure_reference",
       "parts_required", "task_steps", "safety_notes", "proposed_window", "source_documents", "job_summary",
       "scheduling_note", "changes_applied", "status" and "created_at".
     ● "created_at" must be given as text, and every other value must be handed over as stored, with "breakdown_probability" and
       "estimated_downtime_hours" staying numbers.
     ● The row's internal primary key id must not appear, because it means nothing outside this database.
     ● This function must need no session and read nothing from the database, and every function here that returns a repair job
       must give the shape it defines.
RETURNS
A flat record of one repair job.

FUNCTION SIGNATURE
fetch_repair_job_by_id(session, repair_job_id)
PARAMETERS
session — An open database session.
repair_job_id — Text. The repair job being asked about.
PURPOSE
Read one repair job back in full, for the detail view and for confirming what was just saved.
REQUIREMENTS
     ● Exactly one repair job may be matched, by its repair_job_id.
     ● The record must have the shape build_repair_job_dictionary defines.
     ● An id that is not in the table must give an empty record rather than an error, so the web service can turn that into a not-
       found answer of its own.
RETURNS
A record of one repair job, or an empty record when the id is unknown.

FUNCTION SIGNATURE
fetch_repair_jobs_by_status(session, status_value)
PARAMETERS
session — An open database session.
status_value — Text. The status to list, one of config.REPAIR_JOB_STATUS_OPTIONS.
PURPOSE
List every repair job sitting in one status, which is how the review queue finds what is waiting and how the audit trail finds what
has been decided.
REQUIREMENTS
     ● Only repair jobs in exactly status_value may be returned, and all of them must be.
     ● The list must run from newest to oldest by created_at.
     ● Every entry must have the shape build_repair_job_dictionary defines.
     ● A status with nothing in it must give an empty list rather than an error.
RETURNS
A list of repair job records in that status, newest to oldest.

FUNCTION SIGNATURE
insert_review_decision(session, decision_record)
PARAMETERS
session — An open database session.
decision_record — A flat record of the decision, carrying the keys "run_id", "repair_job_id", "decision", "reviewer_name",
"feedback_text" and "reviewed_draft".
PURPOSE
Record what a maintenance supervisor decided about one drafted repair job, and who decided it.
REQUIREMENTS
     ● Only those six keys may be taken from decision_record, and a record carrying extra keys must save cleanly with the extras
       ignored.
     ● decided_at must be stamped by the database as the row is created.
     ● decision, reviewer_name and feedback_text must all come back unchanged when read again.
     ● The save must be complete and visible to a later read by the time the function returns, with the row re-read so the identifier
       the database assigned is available.
RETURNS
The row identifier of the saved decision.


FUNCTION SIGNATURE
build_decision_dictionary(decision_row)
PARAMETERS
decision_row — One saved decision row, as read from the review_decisions table.
PURPOSE
Translate one stored supervisor decision into the flat record the web service and the audit trail read.
REQUIREMENTS
     ● The record must carry exactly the keys "id", "run_id", "repair_job_id", "decision", "reviewer_name", "feedback_text",
       "reviewed_draft" and "decided_at".
     ● "decided_at" must be given as text.
     ● This function must need no session and read nothing from the database, and every function here that returns a decision
       must give the shape it defines.
RETURNS
A flat record of one review decision.

FUNCTION SIGNATURE
fetch_decisions_for_run(session, run_id)
PARAMETERS
session — An open database session.
run_id — Text. The advisory run being asked about.
PURPOSE
Read the decisions recorded against one advisory run, which is what lets a repair job be traced back to the person who
authorised it.
REQUIREMENTS
     ● Only decisions belonging to that run may be returned, and all of them must be.
     ● The list must run from oldest to newest by decided_at.
     ● Every entry must have the shape build_decision_dictionary defines.
     ● A run with no decisions must give an empty list rather than an error.
RETURNS
A list of decision records for that run, oldest to newest.

FUNCTION SIGNATURE
insert_llm_call_record(session, call_record, run_id)
PARAMETERS
session — An open database session.
call_record — A flat record of one language model call, carrying the keys "agent_name", "model_name", "prompt_characters",
"response_characters" and "latency_milliseconds". It does not carry the run, which arrives as its own parameter.
run_id — Text. The run the call belongs to, passed separately because the agent that made the call does not know which run it is
part of.
PURPOSE
Log one language model call so that the cost and the call budget of an advisory run can be audited afterwards.
REQUIREMENTS
     ● Only those six keys may be taken from call_record, and a record carrying extra keys must save cleanly with the extras
       ignored.
     ● prompt_characters, response_characters and latency_milliseconds must be stored as numbers, so a run's calls can be
       counted and totalled.
     ● called_at must be stamped by the database as the row is created, and each call must occupy a row of its own with several
       calls never rolled up into one.
     ● The save must be complete and visible to a later read by the time the function returns, with the row re-read so the identifier
       the database assigned is available.
RETURNS
The row identifier of the saved call log entry.

FUNCTION SIGNATURE
build_call_dictionary(call_row)
PARAMETERS
call_row — One saved call log row, as read from the llm_calls table.
PURPOSE
Translate one stored language model call into the flat record the web service and the audit trail read.
REQUIREMENTS
     ● The record must carry exactly the keys "id", "run_id", "agent_name", "model_name", "prompt_characters",
       "response_characters", "latency_milliseconds" and "called_at".
     ● "called_at" must be given as text, and the three measurements must stay numbers.
     ● This function must need no session and read nothing from the database, and every function here that returns a call log
       entry must give the shape it defines.
RETURNS
A flat record of one language model call.


FUNCTION SIGNATURE
fetch_call_records_for_run(session, run_id)
PARAMETERS
session — An open database session.
run_id — Text. The advisory run being asked about.
PURPOSE
Read the full language model call log of one advisory run, so the run's call budget can be checked against
config.EXPECTED_LLM_CALLS_PER_RUN.
REQUIREMENTS
     ● Only calls belonging to that run may be returned, and all of them must be, so counting the list gives the run's true call
       count.
     ● The list must run from oldest to newest by called_at.
     ● Every entry must have the shape build_call_dictionary defines.
     ● A run with no logged calls must give an empty list rather than an error.
RETURNS
A list of call log records for that run, oldest to newest.



============== AGENTIC WORKFLOW AND REST SERVICE ==============


========== GROUP: AGENTIC WORKFLOW ===========


The advisory workflow is the part of AssetGuard AI that turns a request about one machine into a repair job a maintenance
supervisor can sign off. It is built from four modules: a shared state definition, six agents, nine workflow steps, and the wiring that
joins them.
Two ideas govern every module in this group, and the work is marked on both.
One is the division of labour between tools and agents. A risk score, a risk band, a repair job priority, a downtime estimate and a
passage of manual text are facts. They are produced by the deterministic tools in tools/ and by the trained models, they come out
the same way every time, and they are handed to an agent as material to interpret. An agent is a language model call and nothing
else: it reads facts it was given and produces a judgement in words. An agent must never calculate a risk score, must never
decide a priority and must never look up a procedure. Any implementation in which a language model produces one of those
numbers, or in which an agent is given the ability to reach out and fetch data for itself, does not meet the specification.
The other is the human gate. Taking a machine out of service is a human decision under Safety Rule 02, so the run stops before
any repair job is issued and waits for a named maintenance supervisor. That pause is a business rule, not a technical
convenience. The paused position must be written to disk, so that a run that stops on Wednesday afternoon can be picked up on
Thursday morning even though the process that started it has ended in between, and so that resuming does not repeat the
language model calls that were already made and already paid for.

MODULE: agentic/state.py
CLASS
RepairAdvisoryState
PURPOSE
Declare the single dictionary that every workflow step reads from and writes to, where each step returns only the parts it changed
and those changes are merged back in. This same dictionary is written to disk at the pause, so it is also the definition of what a
resumed run remembers.
REQUIREMENTS
     ● The state definition declares exactly the keys listed below, spelled exactly as shown, and no others.
     ● Every declared key is written by one step and read by another.
     ● llm_call_log accumulates each step's entry rather than being replaced by it, so the whole run's calls survive to be counted.
     ● No trained model, data frame or manual index appears among the declared keys.
STATE KEYS
     ● machine_code — text; the machine the advisory is about, filled by build_initial_state from the incoming request.
     ● request_text — text; what the reliability engineer asked for in their own words, filled by build_initial_state.
     ● access_level — text; the planner's classification of how hard the job is to reach, filled by build_initial_state and used where
       the downtime estimate is stretched for tight space work.
     ● thread_id — text; names the saved conversation this run belongs to, filled by build_initial_state, and the handle by which a
       paused run is found again.
     ● run_id — text; the identifier of the run record opened in the database, filled by load_machine_context_node.
     ● machine_profile — dictionary; the current condition of the machine as the current fleet records it, filled by
       load_machine_context_node.
     ● risk_facts — dictionary; the failure probability, the risk band and the repair job priority, all produced by tools, filled by
       assess_machine_condition_node.
     ● problem_facts — dictionary; the problem type the note classifier voted for and the vote counts behind it, filled by
       identify_problem_type_node.
     ● procedure_facts — dictionary; the manual and safety text retrieved from the document index together with the documents
       it came from, filled by retrieve_procedure_node.
     ● investigation_plan — dictionary; the supervising agent's brief on what the specialists should look at, filled by
       plan_investigation_node.


    ● condition_assessment — dictionary; the condition analyst agent's reading of the condition data and the risk score, filled by
      assess_machine_condition_node.
    ● problem_analysis — dictionary; the reliability engineer agent's judgement on what the note history points to, filled by
      identify_problem_type_node.
    ● procedure_guidance — dictionary; the procedure specialist agent's reading of the retrieved manual text, filled by
      retrieve_procedure_node.
    ● draft_repair_job — dictionary; the complete repair job as drafted, before any human has seen it, filled by
      compose_repair_job_node.
    ● review_decision — dictionary; what the maintenance supervisor decided, filled by request_supervisor_review_node when
      the run is resumed.
    ● final_repair_job — dictionary; the repair job rewritten to carry out the supervisor's instruction, filled by
      finalize_repair_job_node and absent where the draft was rejected.
    ● llm_call_log — list that accumulates rather than replaces; one entry for every language model call made in the run,
      appended by each of the agent steps. It is the run's own running total of what the draft has cost so far, not the record of it:
      each agent step writes its own call to the database as the call is made, so the log carries no count of what has been
      written and no step has to work out what is still outstanding.



MODULE: agentic/agents.py
PURPOSE
Hold the six agents, plus the shared machinery for making one language model call and for reading a reply back into a dictionary.
Every agent in this module is a single language model call: facts arrive as arguments and a judgement in words leaves as the
return value.
REQUIREMENTS
    ● The language model connection and the generation settings applied to every call are prepared at module load time from
      config, and a missing or placeholder key stops the module with a clear message rather than failing inside a run.
    ● No agent can call a tool, a function or an external service for itself, and the model interface's automatic tool-calling
      behaviour is switched off explicitly.
    ● No agent calculates a risk score, decides a priority, estimates a duration or looks up a procedure.
    ● One full run makes exactly config.EXPECTED_LLM_CALLS_PER_RUN calls, each recorded under its own agent name from
      config, with no agent making a second call to repair a reply.


call_language_model
FUNCTION SIGNATURE
call_language_model(prompt_text, agent_name)
PARAMETERS
    ● prompt_text — the complete prompt, already assembled by the calling agent function with every fact written into it.
    ● agent_name — the name this call is recorded under, one of config.AGENT_NAME_PLANNER,
      config.AGENT_NAME_CONDITION, config.AGENT_NAME_PROBLEM, config.AGENT_NAME_PROCEDURE,
      config.AGENT_NAME_WRITER or config.AGENT_NAME_FINALIZER.
PURPOSE
Send one prompt to the language model and record what that call cost, so a run can show exactly how many calls it made and
how long they took.
REQUIREMENTS
    ● Exactly one call per invocation to the model named in config, with no retry loop and no second attempt on a short reply.
    ● response_text carries no surrounding whitespace, and the elapsed time measured around the call is recorded in whole
      milliseconds.
    ● call_record carries exactly the keys agent_name, model_name, prompt_characters, response_characters and
      latency_milliseconds.
    ● prompt_characters and response_characters are character counts of the prompt sent and the reply received, both greater
      than zero.
RETURNS
A dictionary with response_text, the tidied reply, and call_record, the measurement dictionary described above.

parse_labelled_response
FUNCTION SIGNATURE
parse_labelled_response(response_text, field_labels)
PARAMETERS
    ● response_text — the reply text from call_language_model.
    ● field_labels — the list of labels the calling agent asked the model to use, in the spelling that agent chose.
PURPOSE
Read a reply written as labelled lines into a dictionary keyed by those labels, so one field can be picked out by name instead of
searched for in free text.
REQUIREMENTS
    ● Every label in field_labels is a key in the result, holding an empty string where the model supplied nothing, and a missing
      label never raises.
    ● Label matching ignores case, so a label written in title case is still understood.
    ● A label line decorated with bullet, dash or hash characters and surrounding whitespace is still recognised.


     ● Each value is the text following the label and its colon with surrounding whitespace removed, taken from the latest
       occurrence where a label appears more than one time.
RETURNS
A dictionary with one entry per requested label, each holding the text found for it or an empty string.

parse_numbered_steps
FUNCTION SIGNATURE
parse_numbered_steps(response_text, section_label)
PARAMETERS
     ● response_text — the reply text from call_language_model.
     ● section_label — the heading that introduces the list of steps to collect.
PURPOSE
Collect the numbered or bulleted lines sitting underneath one heading in a reply, so a list of steps is held as a list rather than as
one lump of text.
REQUIREMENTS
     ● The collected steps are the lines under the heading line, excluding the heading line itself and excluding blank lines.
     ● Collection stops at any line beginning a different labelled section, so the steps of one section never leak into another.
     ● Each collected step carries no list marker — no number, full stop, dash, asterisk or surrounding whitespace.
     ● A heading the model never wrote yields an empty list rather than an error.
RETURNS
A list of step texts, in the order the model wrote them.

work_planner_agent
FUNCTION SIGNATURE
work_planner_agent(machine_profile, request_text)
PARAMETERS
     ● machine_profile — the machine's register record, produced by fetch_machine_profile and carried in the state by
       load_machine_context_node: tag, type, factory, production line, importance, usage pattern and age.
     ● request_text — what the reliability engineer asked for, carried from build_initial_state.
PURPOSE
Act as the supervising agent of the team, deciding from who the machine is what the specialists should concentrate on and in
what order they should look at it.
REQUIREMENTS
     ● Exactly one language model call, made through call_language_model, recorded under config.AGENT_NAME_PLANNER,
       with the measurement attached under call_record.
     ● The agent is given no condition readings and no model output, and is instructed not to diagnose anything or invent
       readings.
     ● The result states what matters most for this machine, the order the specialist checks should run in, and the reasoning
       behind that order.
     ● The result's named fields are the ones the condition analyst reads.
RETURNS
A dictionary of the planner's fields, plus call_record.

condition_analyst_agent
FUNCTION SIGNATURE
condition_analyst_agent(machine_profile, risk_facts, investigation_plan)
PARAMETERS
     ● machine_profile — the machine's condition record, from fetch_machine_profile: vibration mean, maximum and fourteen
       day trend, bearing temperature, oil particle code, alarms per week, days since last service and breakdowns in the last
       twelve months.
     ● risk_facts — the failure probability and risk band already produced by predict_breakdown_probability and
       classify_risk_band inside assess_machine_condition_node.
     ● investigation_plan — the brief returned by work_planner_agent.
PURPOSE
Explain, for a maintenance supervisor, what the week's condition readings and the model's risk score actually mean for this
machine.
REQUIREMENTS
     ● Exactly one language model call, recorded under config.AGENT_NAME_CONDITION, with the measurement attached
       under call_record.
     ● The planner's brief is present in the prompt and answered in the result.
     ● The probability and the band arrive as settled facts the agent is told not to recalculate, and the readings it may cite are
       confined to those already in machine_profile.
     ● The result covers the state of the machine, the readings driving the risk, what should happen, and an urgency word for a
       human reader that is not the repair job priority from resolve_repair_priority and config.PRIORITY_MATRIX.
RETURNS
A dictionary of the analyst's fields, plus call_record.

problem_analyst_agent


FUNCTION SIGNATURE
problem_analyst_agent(problem_facts, condition_assessment)
PARAMETERS
     ● problem_facts — the classifier's verdict on the note history, from detect_problem_type: the leading mode, the agreement
       level, the number of past notes and the full vote count.
     ● condition_assessment — the condition reading returned by condition_analyst_agent, carrying its summary and key
       signals.
PURPOSE
Judge what the classifier's votes across the machine's past technician notes mean, and whether the condition data supports or
contradicts them.
REQUIREMENTS
     ● Exactly one language model call, recorded under config.AGENT_NAME_PROBLEM, with the measurement attached under
       call_record.
     ● The agent is instructed not to reclassify the notes, weighing the classifier's verdict rather than repeating it.
     ● The mode the result names appears in the vote count the agent was given.
     ● The result covers which mode is most likely, how strongly the note history agrees, and how the condition readings bear on
       that.
RETURNS
A dictionary of the reliability engineer's fields, plus call_record.

procedure_advisor_agent
FUNCTION SIGNATURE
procedure_advisor_agent(procedure_facts, problem_analysis)
PARAMETERS
     ● procedure_facts — the retrieved manual and safety text, assembled in retrieve_procedure_node from
       lookup_repair_procedure and lookup_safety_requirement.
     ● problem_analysis — the judgement returned by problem_analyst_agent.
PURPOSE
Turn the retrieved manual and safety passages into the procedure part of a repair job: which procedure applies, what permit is
needed, what parts are named, what safety requirements apply and what the steps are.
REQUIREMENTS
     ● Exactly one language model call, recorded under config.AGENT_NAME_PROCEDURE, with the measurement attached
       under call_record.
     ● The agent is grounded in the passages handed to it alone, and says plainly that a detail is absent from the retrieved
       documents rather than supplying it from general engineering knowledge.
     ● The agent performs no search of its own against the document index.
     ● The result covers the procedure reference, the permit position, the parts named, the safety requirements, and an ordered
       list of repair steps read back with parse_numbered_steps while the single-value fields are read back with
       parse_labelled_response.
RETURNS
A dictionary of the specialist's fields, with the steps held as a list, plus call_record.

repair_job_writer_agent
FUNCTION SIGNATURE
repair_job_writer_agent(condition_assessment, problem_analysis, procedure_guidance)
PARAMETERS
     ● condition_assessment — from condition_analyst_agent.
     ● problem_analysis — from problem_analyst_agent.
     ● procedure_guidance — from procedure_advisor_agent.
PURPOSE
Write the draft repair job that the maintenance supervisor will read: a short summary, the task steps, and a note on when the job
should be done.
REQUIREMENTS
     ● Exactly one language model call, recorded under config.AGENT_NAME_WRITER, with the measurement attached under
       call_record.
     ● Every instruction written stays consistent with procedure_guidance, carrying no step the procedure specialist did not
       provide.
     ● The agent is told it is writing a draft a maintenance supervisor must approve before any work starts, and it is given no risk
       number, priority or downtime estimate to work out.
     ● The result is a summary a supervisor can read at a glance, an ordered list of task steps read back as a list, and a
       scheduling note with its reason read back as single values.
RETURNS
A dictionary carrying the summary, the task step list and the scheduling note, plus call_record.

repair_job_finalizer_agent
FUNCTION SIGNATURE
repair_job_finalizer_agent(draft_repair_job, review_decision)
PARAMETERS


    ● draft_repair_job — the drafted repair job built by compose_repair_job_node, carrying its summary, steps, scheduling note
      and proposed window.
    ● review_decision — the supervisor's answer, carried into the state by request_supervisor_review_node, carrying decision,
      reviewer_name and feedback_text.
PURPOSE
Rewrite the repair job so that it carries out exactly what the supervisor decided, and state what changed compared with the draft.
REQUIREMENTS
    ● Exactly one language model call, recorded under config.AGENT_NAME_FINALIZER, with the measurement attached under
      call_record.
    ● The reviewer's instruction is applied exactly, adding no work the supervisor did not ask for and dropping nothing they did
      not ask to have removed.
    ● The result is the rewritten summary, the rewritten task step list, and a statement of what changed that reads as nothing
      having changed where the supervisor asked for no change.
    ● The agent runs only where the supervisor let the draft through, which is what makes a rejected repair job cost one
      language model call fewer than an approved one.
RETURNS
A dictionary carrying the final summary, the final task step list and the record of changes, plus call_record.



MODULE: agentic/nodes.py
PURPOSE
Hold the nine steps of the advisory run. A step reads the shared state, does one piece of work, and returns only the parts of the
state it changed.
REQUIREMENTS
    ● Tool steps make no language model call, agent steps make exactly one, and the review step makes none at all.
    ● Six of the nine steps make a language model call, equal to config.EXPECTED_LLM_CALLS_PER_RUN.
    ● The trained models, their feature schemas, the current fleet, the cleaned technician notes and the searchable manual index
      are loaded at module load time from the paths in config, never inside a step.
    ● No step returns a key agentic/state.py does not declare, returns the whole state, or re-runs work another step has already
      done.

load_machine_context_node
FUNCTION SIGNATURE
load_machine_context_node(state)
PARAMETERS
    ● state — the shared workflow state, carrying at least machine_code, request_text and thread_id from build_initial_state.
PURPOSE
Look the machine up in the current fleet and open a run record in the database, so everything the run does can be traced back to
a row.
REQUIREMENTS
    ● Tool step with no language model call.
    ● The lookup uses fetch_machine_profile against the reading from config.CURRENT_FLEET_FILE, and an machine_code
      absent from that reading stops the run with an error naming the tag.
    ● A run_id unique to every run and prefixed RUN- is written through insert_agent_run with thread_id, machine_code,
      request_text and a status of config.AGENT_RUN_STATUS_RUNNING.
    ● The database session opened here is closed before the step returns.
RETURNS
The run_id and the machine_profile.

plan_investigation_node
FUNCTION SIGNATURE
plan_investigation_node(state)
PARAMETERS
    ● state — carrying machine_profile from load_machine_context_node and request_text.
PURPOSE
Have the supervising agent decide how the specialist team should investigate.
REQUIREMENTS
    ● Agent step with exactly one language model call, made by work_planner_agent.
    ● No tool runs here; the planner is given the register facts already in the state.
    ● The call measurement is appended to llm_call_log as a single-entry list rather than replacing the log.
    ● The call is recorded through insert_llm_call_record against run_id before the step returns, in a session of its own that is
      closed again, so a call already spent appears in the budget even where a later step fails.
RETURNS
The investigation_plan and one new entry for llm_call_log.

assess_machine_condition_node
FUNCTION SIGNATURE
assess_machine_condition_node(state)


PARAMETERS
    ● state — carrying machine_profile from load_machine_context_node and investigation_plan from plan_investigation_node.
PURPOSE
Score the machine with the breakdown risk model, settle its band and priority, and have the condition analyst agent explain what
the score means.
REQUIREMENTS
    ● Tool work and exactly one language model call in the one step, the agent receiving the profile, the risk facts and the
      planner's brief.
    ● The model input row is built with build_model_input_row against the schema from config.BREAKDOWN_SCHEMA_FILE, so
      the columns arrive in the exact order the model was trained on.
    ● The probability comes from predict_breakdown_probability, the band from classify_risk_band using
      config.HIGH_RISK_THRESHOLD and config.MEDIUM_RISK_THRESHOLD, and the priority from resolve_repair_priority
      given the machine's importance and that band, none of them produced or adjusted by an agent.
    ● risk_facts carries exactly the keys breakdown_probability, risk_band and priority.
    ● The call is recorded through insert_llm_call_record against run_id before the step returns, in a session of its own that is
      closed again, so a call already spent appears in the budget even where a later step fails.
RETURNS
The risk_facts, the condition_assessment and one new entry for llm_call_log.

identify_problem_type_node
FUNCTION SIGNATURE
identify_problem_type_node(state)
PARAMETERS
    ● state — carrying machine_code and condition_assessment from assess_machine_condition_node.
PURPOSE
Classify the machine's past technician notes and have the reliability engineer agent judge the result.
REQUIREMENTS
    ● Tool work and exactly one language model call in the one step.
    ● The note history comes from fetch_machine_note_history against the cleaned notes loaded from
      config.CLEAN_TECHNICIAN_NOTES_FILE.
    ● The classification comes from detect_problem_type using the saved problem type model and text vectorizer, with the
      agent given the votes rather than the raw notes.
    ● A machine with no note history does not crash the run, and the classifier's empty result is passed on as it stands.
    ● The call is recorded through insert_llm_call_record against run_id before the step returns, in a session of its own that is
      closed again, so a call already spent appears in the budget even where a later step fails.
RETURNS
The problem_facts, the problem_analysis and one new entry for llm_call_log.

retrieve_procedure_node
FUNCTION SIGNATURE
retrieve_procedure_node(state)
PARAMETERS
    ● state — carrying machine_profile from load_machine_context_node and problem_facts from identify_problem_type_node.
PURPOSE
Search the indexed manuals for the repair procedure and the safety rules that apply, and have the procedure specialist agent read
them.
REQUIREMENTS
    ● Tool work and exactly one language model call in the one step.
    ● Two searches run against the index opened from config.VECTOR_STORE_DIRECTORY and
      config.VECTOR_COLLECTION_NAME: lookup_repair_procedure for this machine type and the problem type taken from
      problem_facts, and lookup_safety_requirement for this machine type.
    ● source_documents holds each document name exactly one time, in order of initial appearance, with the procedure
      search's documents ahead of the safety search's.
    ● procedure_facts carries exactly the keys procedure_context, safety_context and source_documents.
    ● The call is recorded through insert_llm_call_record against run_id before the step returns, in a session of its own that is
      closed again, so a call already spent appears in the budget even where a later step fails.
RETURNS
The procedure_facts, the procedure_guidance and one new entry for llm_call_log.

compose_repair_job_node
FUNCTION SIGNATURE
compose_repair_job_node(state)
PARAMETERS
    ● state — carrying machine_profile, risk_facts, problem_facts, procedure_facts, procedure_guidance,
      condition_assessment, problem_analysis, access_level, run_id, machine_code and llm_call_log.
PURPOSE
Estimate how long the machine will be out of service, have the composer agent write the draft, assemble the complete repair job
record, and save it.


REQUIREMENTS
    ● Tool work and exactly one language model call in the one step, with a repair_job_id unique to every draft and prefixed WO-.
    ● estimated_downtime_hours comes from estimate_repair_downtime on a row built with build_model_input_row against
      config.DOWNTIME_SCHEMA_FILE from the record build_planned_repair_record produces out of the machine profile, the
      risk facts and a job context carrying problem_type and access_level, with apply_tight_space_factor applied a single time
      and never by an agent.
    ● draft_repair_job carries exactly the keys repair_job_id, run_id, machine_code, machine_type, breakdown_probability,
      risk_band, problem_type, priority, estimated_downtime_hours, permit_required, procedure_reference, parts_required,
      task_steps, safety_notes, proposed_window, source_documents, job_summary, scheduling_note and status, where the
      probability, band and priority are the ones in risk_facts, task_steps is one block of text with one step per line,
      source_documents is one block of text separated by a comma and a space, proposed_window is
      config.STANDARD_SHUTDOWN_WINDOW and status is config.REPAIR_JOB_STATUS_PENDING.
    ● The draft is saved through insert_repair_job_draft, the run status moved to
      config.AGENT_RUN_STATUS_AWAITING_REVIEW through update_agent_run_status, and the session closed before
      returning.
    ● The call is recorded through insert_llm_call_record against run_id before the step returns, in a session of its own that is
      closed again, so a call already spent appears in the budget even where a later step fails.
RETURNS
The draft_repair_job and one new entry for llm_call_log.

request_supervisor_review_node
FUNCTION SIGNATURE
request_supervisor_review_node(state)
PARAMETERS
    ● state — carrying draft_repair_job from compose_repair_job_node.
PURPOSE
Stop the run and wait for a maintenance supervisor. No further language model call is made under any circumstances until a
person answers.
REQUIREMENTS
    ● The run halts here — never skipped, never optional, never replaced by an agent deciding for itself — with its position and
      the whole of its state written to disk, so the process may end entirely and the run still be picked up on another day at
      exactly this step.
    ● Resuming continues from this step rather than restarting, and the five calls already made are never repeated.
    ● The summary handed to the waiting human carries repair_job_id, machine_code, risk_band, priority,
      estimated_downtime_hours, job_summary, task_steps, proposed_window and decision_options, the last being
      config.REVIEW_DECISION_OPTIONS.
    ● The answer arriving on resume is stored unchanged as review_decision, carrying decision, reviewer_name and
      feedback_text.
RETURNS
The review_decision.

finalize_repair_job_node
FUNCTION SIGNATURE
finalize_repair_job_node(state)
PARAMETERS
    ● state — carrying draft_repair_job from compose_repair_job_node and review_decision from
      request_supervisor_review_node.
PURPOSE
Rewrite the repair job to carry out the supervisor's instruction, leaving everything they did not comment on as it was.
REQUIREMENTS
    ● Agent step with exactly one language model call, made by repair_job_finalizer_agent, and reached only where the
      supervisor let the draft through.
    ● final_repair_job is a copy of draft_repair_job, so the identifiers, the probability, the band, the priority, the downtime
      estimate, the permit, the procedure reference, the parts, the safety notes, the window and the citations survive review
      unchanged.
    ● draft_repair_job in the state is not altered in place, because the rejected-draft record requires the draft to survive exactly as
      written.
    ● Only job_summary, task_steps and status are replaced, changes_applied is added carrying the agent's statement of what
      changed, task_steps is rejoined into one block of text with one step per line exactly as the draft stores it, and status
      becomes config.REPAIR_JOB_STATUS_APPROVED.
    ● The call is recorded through insert_llm_call_record against run_id before the step returns, in a session of its own that is
      closed again, so a call already spent appears in the budget even where a later step fails.
RETURNS
The final_repair_job and one new entry for llm_call_log.

persist_review_outcome_node
FUNCTION SIGNATURE
persist_review_outcome_node(state)


PARAMETERS
    ● state — carrying review_decision, draft_repair_job, run_id, and final_repair_job where the draft was not rejected.
PURPOSE
Close the run: record what the supervisor decided, set the repair job to its final status, and mark the run complete.
REQUIREMENTS
    ● Tool step with no language model call, leaving the run at config.AGENT_RUN_STATUS_COMPLETE through
      update_agent_run_status and the session closed before returning.
    ● Exactly one decision per run is recorded through insert_review_decision, carrying run_id, repair_job_id, decision,
      reviewer_name, feedback_text and reviewed_draft, the last holding both the summary and the task steps as the
      supervisor saw them, since the finalizer is about to overwrite the steps on the repair job row and Safety Rule 02 requires
      the draft that was authorised to survive alongside the amended one.
    ● A decision equal to config.REVIEW_DECISION_REJECT leaves the draft on the record exactly as the agents wrote it with
      only its status changed to config.REPAIR_JOB_STATUS_REJECTED through update_repair_job_status, while both other
      options replace it through apply_review_outcome with the finalizer's version and the note of what changed, at status
      config.REPAIR_JOB_STATUS_APPROVED.
    ● No call is recorded here, because every call was written by the step that made it, leaving a run whose draft was let through
      with exactly config.EXPECTED_LLM_CALLS_PER_RUN recorded calls and a rejected one with exactly one fewer.
RETURNS
Nothing. The run is closed in the database rather than in the state.



MODULE: agentic/graph.py
PURPOSE
Wire the nine steps into one workflow, give it somewhere on disk to remember paused runs, and provide the two calls that start a
run and resume it.
STEP ORDER
The workflow runs its steps in this fixed order, and the order is part of the specification:
load_machine_context, plan_investigation, assess_machine_condition, identify_problem_type, retrieve_procedure,
compose_repair_job, request_supervisor_review, finalize_repair_job, persist_review_outcome.
The step named finalize_repair_job is skipped where the supervisor rejected the draft, in which case request_supervisor_review
leads straight to persist_review_outcome.
REQUIREMENTS
    ● The steps run one after another rather than fanning out in parallel, so six calls spread over a few seconds stay inside the
      language model's per-minute allowance.
    ● The registered step names are exactly the names listed above, because the branch out of the review gate selects between
      two of them by name.
    ● Every run is written to disk after each step, leaving a run paused at the review gate resumable after the process that
      created it has ended.
    ● The state the workflow carries has the shape declared in agentic/state.py.

create_checkpoint_saver
FUNCTION SIGNATURE
create_checkpoint_saver(checkpoint_path)
PARAMETERS
    ● checkpoint_path — where the saved runs live on disk, in practice config.CHECKPOINT_DATABASE_FILE.
PURPOSE
Open the store that holds paused runs, so a run's position and state outlive the process that created them.
REQUIREMENTS
    ● The store is a file on disk at checkpoint_path, not memory, so no paused run is lost when the process ends.
    ● The connection tolerates use from more than one thread, so a review submitted from the dashboard does not fail with a
      threading error.
RETURNS
The opened store, ready to be given to build_workflow.

route_after_review
FUNCTION SIGNATURE
route_after_review(state)
PARAMETERS
    ● state — carrying review_decision, filled by request_supervisor_review_node when the run was resumed.
PURPOSE
Decide where the run goes when the supervisor has answered.
REQUIREMENTS
    ● A decision equal to config.REVIEW_DECISION_REJECT routes to persist_review_outcome, skipping the finalizer and its
      language model call.
    ● Any other decision routes to finalize_repair_job.
    ● The value returned is exactly one of those two step names.
    ● The routing is a comparison against a configured value, with no language model call made here.
RETURNS


The name of the step the run moves to.

build_workflow
FUNCTION SIGNATURE
build_workflow(checkpoint_saver)
PARAMETERS
     ● checkpoint_saver — the on-disk store returned by create_checkpoint_saver.
PURPOSE
Register the nine steps, join them in the required order, attach the branch out of the review gate, and produce a workflow ready to
run that saves itself to disk as it goes.
REQUIREMENTS
     ● All nine steps are registered under the names listed in the step order above, each bound to its function in
       agentic/nodes.py.
     ● The run enters at load_machine_context and leaves at persist_review_outcome.
     ● The links between steps follow the step order exactly, with the single branch out of request_supervisor_review decided by
       route_after_review and offering exactly the two destinations finalize_repair_job and persist_review_outcome. Both
       destinations must be declared on the branch itself, not left for the deciding function to name at run time, so that the
       finished workflow can be drawn and every step shown to be reachable.
     ● finalize_repair_job leads on to persist_review_outcome so no path can end without the decision being recorded, and the
       finished workflow is bound to checkpoint_saver so state is written to disk after every step.
RETURNS
The finished workflow, ready to be started and resumed.

build_initial_state
FUNCTION SIGNATURE
build_initial_state(advisory_request, thread_id)
PARAMETERS
     ● advisory_request — one dictionary carrying machine_code, request_text and access_level, as validated by the
       AdvisoryRequest shape and passed in by create_advisory_run.
     ● thread_id — the name of the saved conversation this run belongs to, generated by create_advisory_run.
PURPOSE
Create the empty state a new advisory run starts from.
REQUIREMENTS
     ● The returned state carries every key declared in agentic/state.py and no key that is not declared there.
     ● machine_code, request_text and access_level are carried straight through from advisory_request, and thread_id from the
       argument of that name.
     ● Every key a step fills during the run is empty — text keys empty text, dictionary keys empty dictionaries and llm_call_log an
       empty list — with no placeholder that could be mistaken for a real answer.
     ● thread_id differs for every run, so a second advisory on the same machine does not resume the earlier one.
RETURNS
The starting state.

start_advisory_run
FUNCTION SIGNATURE
start_advisory_run(compiled_graph, initial_state, thread_config)
PARAMETERS
     ● compiled_graph — the workflow returned by build_workflow.
     ● initial_state — the starting state from build_initial_state.
     ● thread_config — the settings that name which saved conversation this run belongs to, built around the same thread
       identifier given to build_initial_state.
PURPOSE
Run the workflow from the beginning up to the review gate and hand back the state as it stands at the pause.
REQUIREMENTS
     ● The run stops of its own accord at the review gate, and this call does not drive it past that point.
     ● Five language model calls have been made when this returns, and draft_repair_job is already saved.
     ● The state is started under thread_config, the handle resume_workflow_after_review uses to find the paused run.
RETURNS
The state as it stands at the pause, from which the drafted repair job can be read.

resume_workflow_after_review
FUNCTION SIGNATURE
resume_workflow_after_review(compiled_graph, thread_config, review_decision)
PARAMETERS
     ● compiled_graph — the workflow returned by build_workflow.
     ● thread_config — settings naming the paused conversation, rebuilt from the thread_id stored on the run record and read
       back with fetch_agent_run.
     ● review_decision — the supervisor's answer, carrying decision, reviewer_name and feedback_text, as validated by the
       ReviewDecisionRequest shape.


PURPOSE
Carry a paused run on from the review gate, feeding it the decision the supervisor made.
REQUIREMENTS
    ● The run continues from the review gate, with the five calls made before the pause never repeated and the drafted repair job
      never written twice.
    ● review_decision in the state holds the supervisor's answer, delivered as the value the paused step was waiting for.
    ● Resuming works even where the process that started the run has ended, because the paused position was written to disk.
    ● A decision of config.REVIEW_DECISION_REJECT costs no further language model call and any other decision costs
      exactly one, bringing the run to config.EXPECTED_LLM_CALLS_PER_RUN in total.
RETURNS
The state as it stands when the run has closed.

=========== GROUP: REST SERVICE ==========


The REST service is the only place in the running system where a model is loaded and a risk score is worked out. The dashboard
holds no models and no database connection of its own; everything it displays comes from these endpoints. That means the field
names below are a contract read by the dashboard, and must be spelled exactly as given.
Two endpoints cost language model calls: starting an advisory and submitting a review decision. Everything else reads the
database or runs a saved model and costs nothing.

MODULE: api/schemas.py
PURPOSE
Declare the shapes of everything that arrives at the service and everything that leaves it, so values are checked on the way in and
on the way out.
REQUIREMENTS
    ● A request carrying an invalid value, or missing a required field, is refused with status 422 before any workflow step runs
      and therefore before any language model call is made.
    ● Every field name below is spelled exactly as given.
    ● A response shape built from a database row accepts a plain dictionary of that row's values, and the record types they are
      built from carry their timestamps as text.
    ● A response shape built from a current fleet row or a scored fleet table row ignores the columns it does not declare rather
      than refusing the row.

AdvisoryRequest
REQUEST SHAPE
AdvisoryRequest — asks the agents to assess one machine and draft a repair job.
FIELDS
    ● machine_code — text; the machine to assess.
    ● request_text — text; what the reliability engineer wants, in their own words.
    ● access_level — text; the planner's classification of how hard the job is to reach.
VALIDATION
    ● machine_code shorter than three characters is refused.
    ● request_text shorter than five characters is refused.
    ● access_level outside config.ACCESS_LEVEL_OPTIONS is refused, because Safety Rule 03 makes tight space work take
      longer and the multiplier is applied while the estimate is made.
    ● Any of the three fields missing is refused, and every refusal carries status 422 and happens before the agents run.

ReviewDecisionRequest
REQUEST SHAPE
ReviewDecisionRequest — a maintenance supervisor's answer on a drafted repair job.
FIELDS
    ● decision — text; what the supervisor decided.
    ● reviewer_name — text; who decided it.
    ● feedback_text — text; the instruction that goes with the decision.
VALIDATION
    ● decision outside config.REVIEW_DECISION_OPTIONS is refused.
    ● reviewer_name shorter than two characters is refused, so nobody is accountable for a decision under a blank name.
    ● feedback_text may be empty, since an outright approval needs no instruction, but the field itself must be present.
    ● Every refusal carries status 422.

MachineProfileResponse
RESPONSE SHAPE
MachineProfileResponse — the current condition of one machine, as the current fleet records it.
FIELDS
machine_code, machine_type, factory_name, production_line, importance, usage_pattern, machine_age_months,
average_vibration, average_temperature_c, oil_dirtiness_score, alarms_this_week, days_since_last_service,
breakdowns_last_year.
VALIDATION
    ● The six register fields are text and the seven condition fields are numbers with a decimal part.


    ● The shape is built from the dictionary fetch_machine_profile returns, with the reading columns it does not declare ignored
      rather than refused.

RiskAssessmentResponse
RESPONSE SHAPE
RiskAssessmentResponse — what the breakdown risk model says about one machine.
FIELDS
machine_code, breakdown_probability, risk_band, priority, importance.
VALIDATION
    ● breakdown_probability is a number with a decimal part, and the other four are text.
    ● risk_band and priority are the ones the configured thresholds and config.PRIORITY_MATRIX give for the
      breakdown_probability and importance in the same response.


RepairJobResponse
RESPONSE SHAPE
RepairJobResponse — one repair job, drafted or approved.
FIELDS
repair_job_id, run_id, machine_code, machine_type, breakdown_probability, risk_band, problem_type, priority,
estimated_downtime_hours, permit_required, procedure_reference, parts_required, task_steps, safety_notes, proposed_window,
source_documents, job_summary, scheduling_note, changes_applied, status, created_at.
VALIDATION
    ● breakdown_probability and estimated_downtime_hours are numbers with a decimal part, and every other field is text,
      including created_at.
    ● changes_applied is empty text on a draft that has not been reviewed, and is present rather than absent.
    ● status is one of config.REPAIR_JOB_STATUS_OPTIONS.
    ● The shape is built from the dictionary fetch_repair_job_by_id returns, so every field it declares exists on the saved record.

ReviewDecisionResponse
RESPONSE SHAPE
ReviewDecisionResponse — one recorded supervisor decision.
FIELDS
id, run_id, repair_job_id, decision, reviewer_name, feedback_text, reviewed_draft, decided_at.
VALIDATION
    ● id is a whole number, and every other field is text, including decided_at.
    ● decision is one of config.REVIEW_DECISION_OPTIONS.
    ● The shape is built from the dictionary fetch_decisions_for_run returns.

FleetRiskRow
RESPONSE SHAPE
FleetRiskRow — one line of the fleet risk table shown on the dashboard.
FIELDS
machine_code, machine_type, factory_name, importance, breakdown_probability, risk_band, priority, average_vibration,
average_temperature_c, alarms_this_week.
VALIDATION
    ● breakdown_probability, average_vibration, average_temperature_c and alarms_this_week are numbers with a decimal
      part, and the rest are text.
    ● The shape is built from a row of the table score_current_fleet produces, with the columns it does not declare ignored
      rather than refused.

MachineNoteHistoryResponse
RESPONSE SHAPE
MachineNoteHistoryResponse — what the past technician notes say about one machine.
FIELDS
machine_code, note_count, detected_problem_type, confidence, problem_votes, recent_notes.
VALIDATION
    ● note_count is a whole number, confidence is a number with a decimal part, problem_votes is a mapping of mode name to
      vote count, and recent_notes is a list.
    ● The field is named detected_problem_type here even though the tool that produces it calls its own key problem_type.

CallBudgetResponse
RESPONSE SHAPE
CallBudgetResponse — how many language model calls one advisory run used, and what they cost.
FIELDS
run_id, call_count, expected_call_count, total_latency_milliseconds, calls.
VALIDATION
    ● call_count, expected_call_count and total_latency_milliseconds are whole numbers, run_id is text, and calls is a list of the
      recorded call entries.
    ● expected_call_count is not a fixed number, since a rejected repair job skips the finalizer and a correctly finished rejection
      uses one call fewer.


MODULE: api/routes.py
PURPOSE
Expose the machine lookups, the risk scores, the advisory workflow and the review endpoints over HTTP, and assemble them into
one application.
REQUIREMENTS
    ● The workflow, the trained models and their schemas, the current fleet, the cleaned notes and the scored fleet table are
      prepared at module load time from the paths in config, so the fleet endpoint is a table read rather than a model run per
      request.
    ● Every endpoint that needs the database is handed a live session from get_database_session rather than opening one
      itself, and no endpoint carries a default parameter value.
    ● A machine profile, risk score, repair job or run that does not exist is answered with status 404, and a value outside the set
      the configuration allows with status 422, never with an empty result that reads as success.
    ● Only POST /advisories and POST /repairjobs/{repair_job_id}/review may cost language model calls.

create_api_application
FUNCTION SIGNATURE
create_api_application(application_title)
PARAMETERS
    ● application_title — the service's title, in practice config.API_TITLE.
PURPOSE
Build the web application and attach every endpoint to it, so the service can be started from an entry point script and also driven
directly in process.
REQUIREMENTS
    ● Every endpoint in this module is reachable on the application returned.
    ● The title is application_title, not a value written into this function.
    ● A short description of the service is set alongside the title, so the interactive documentation page is usable.
    ● Calling this function does not start a server.
RETURNS
The assembled application.

get_machine_profile
ENDPOINT
GET /machines/{machine_code}
FUNCTION SIGNATURE
get_machine_profile(machine_code)
PARAMETERS
    ● machine_code — taken from the path.
PURPOSE
Return the latest condition reading held for one machine.
REQUIREMENTS
    ● The lookup uses fetch_machine_profile against the reading loaded at module load from config.CURRENT_FLEET_FILE.
    ● An machine_code absent from the reading is answered with status 404 and a message saying the machine was not
      found.
    ● The machine_code in the response is the one that was asked for.
    ● No database access and no language model call.
RETURNS
An MachineProfileResponse for that machine.

get_machine_risk
ENDPOINT
GET /machines/{machine_code}/risk
FUNCTION SIGNATURE
get_machine_risk(machine_code)
PARAMETERS
    ● machine_code — taken from the path.
PURPOSE
Score one machine with the breakdown risk model and report the band and the repair job priority that follow from that score.
REQUIREMENTS
    ● The profile comes from fetch_machine_profile, and an unknown machine_code is answered with status 404.
    ● The input row is built with build_model_input_row against the schema from config.BREAKDOWN_SCHEMA_FILE, the
      probability from predict_breakdown_probability, the band from classify_risk_band using config.HIGH_RISK_THRESHOLD
      and config.MEDIUM_RISK_THRESHOLD, and the priority from resolve_repair_priority given the machine's own importance
      and that band.
    ● breakdown_probability lies between zero and one inclusive.
    ● risk_band is the band the configured thresholds give for the breakdown_probability reported in the same response, and no
      language model call is made.


RETURNS
A RiskAssessmentResponse for that machine.

list_fleet_risk_summary
ENDPOINT
GET /fleet/risk
FUNCTION SIGNATURE
list_fleet_risk_summary(risk_band)
PARAMETERS
    ● risk_band — a query value naming which band to return, or config.RISK_BAND_ALL for the whole fleet.
PURPOSE
Return every machine the risk model has scored, worst at the top, optionally narrowed to one band.
REQUIREMENTS
    ● The accepted values are config.RISK_BAND_HIGH, config.RISK_BAND_MEDIUM, config.RISK_BAND_LOW and
      config.RISK_BAND_ALL, and anything else is refused with status 422 and a message naming what was allowed.
    ● config.RISK_BAND_ALL returns the whole fleet, and any other accepted value returns only rows whose risk_band equals
      the value asked for.
    ● Rows come out in descending order of breakdown_probability, the ordering score_current_fleet establishes, and that
      ordering survives the filtering.
    ● The endpoint runs no model and makes no language model call, the fleet having been scored at service start-up.
RETURNS
A list of FleetRiskRow in descending order of breakdown_probability.

get_machine_note_history
ENDPOINT
GET /machines/{machine_code}/notes
FUNCTION SIGNATURE
get_machine_note_history(machine_code)
PARAMETERS
    ● machine_code — taken from the path.
PURPOSE
Report the problem type the machine's past technician notes point to, together with the newest of those notes.
REQUIREMENTS
    ● The notes come from fetch_machine_note_history against the cleaned notes loaded from
      config.CLEAN_TECHNICIAN_NOTES_FILE, and the verdict from detect_problem_type using the saved problem type model
      and text vectorizer.
    ● detected_problem_type, confidence, note_count and problem_votes are the values those tools produced, with no note re-
      read or re-classified here.
    ● recent_notes holds at most five notes, the newest of the history the tool returns in oldest-to-newest order.
    ● A machine with no notes is answered normally with note_count of zero and an empty problem_votes rather than an error,
      and no language model call is made.
RETURNS
An MachineNoteHistoryResponse for that machine.

create_advisory_run
ENDPOINT
POST /advisories
FUNCTION SIGNATURE
create_advisory_run(advisory_request, session)
PARAMETERS
    ● advisory_request — the request body, validated against the AdvisoryRequest shape.
    ● session — a live database session supplied by the service from get_database_session.
PURPOSE
Run the agents up to the review gate and return the repair job they drafted.
REQUIREMENTS
    ● A body that fails validation is refused with status 422 before the workflow starts, so a refused request adds nothing at all
      to the language model call log.
    ● The conversation identifier generated here is unique to every advisory, the starting state comes from build_initial_state on
      the validated request and that identifier, and start_advisory_run drives the run under conversation settings naming the
      same identifier.
    ● Five language model calls are made and the run stops on disk at the review gate, this endpoint driving it no further and
      asking no person for anything itself.
    ● A machine_code the current fleet does not carry is answered with status 404 before the workflow is started, so an
      unknown machine costs no language model call and gives the caller the same plain answer every other endpoint gives for
      a machine that does not exist.
    ● A run coming back without a drafted repair job is answered with status 500, while a successful call answers with status
      201 carrying the record fetch_repair_job_by_id returns rather than the state's copy.
RETURNS


A RepairJobResponse for the drafted repair job, with status 201.

list_repair_jobs_by_status
ENDPOINT
GET /repairjobs
FUNCTION SIGNATURE
list_repair_jobs_by_status(status_value, session)
PARAMETERS
     ● status_value — a query value naming which status to list.
     ● session — a live database session supplied by the service from get_database_session.
PURPOSE
List every repair job in one status, newest at the top.
REQUIREMENTS
     ● A status_value outside config.REPAIR_JOB_STATUS_OPTIONS is refused with status 422 and a message naming what
       was allowed.
     ● An accepted status_value answers with status 200, and every repair job returned carries the status that was asked for.
     ● The ordering, newest at the top, is the one fetch_repair_jobs_by_status establishes.
     ● An accepted status_value with no matching repair jobs answers with an empty list rather than a 404, and no language
       model call is made.
RETURNS
A list of RepairJobResponse.

get_repair_job_detail
ENDPOINT
GET /repairjobs/{repair_job_id}
FUNCTION SIGNATURE
get_repair_job_detail(repair_job_id, session)
PARAMETERS
     ● repair_job_id — taken from the path.
     ● session — a live database session supplied by the service from get_database_session.
PURPOSE
Return one repair job in full.
REQUIREMENTS
     ● The record comes from fetch_repair_job_by_id.
     ● A repair_job_id absent from the database is answered with status 404 and a message saying the repair job was not found.
     ● No language model call.
RETURNS
A RepairJobResponse.

submit_review_decision
ENDPOINT
POST /repairjobs/{repair_job_id}/review
FUNCTION SIGNATURE
submit_review_decision(repair_job_id, decision_request, session)
PARAMETERS
     ● repair_job_id — taken from the path.
     ● decision_request — the request body, validated against the ReviewDecisionRequest shape.
     ● session — a live database session supplied by the service from get_database_session.
PURPOSE
Record the maintenance supervisor's decision and let the paused run finish.
REQUIREMENTS
     ● A decision outside config.REVIEW_DECISION_OPTIONS, or a reviewer_name too short to identify anybody, is refused with
       status 422 before the run is touched.
     ● An unknown repair_job_id, or a repair job whose run is missing from fetch_agent_run, is answered with status 404, while a
       repair job whose status is not config.REPAIR_JOB_STATUS_PENDING is refused with status 409, so exactly one decision
       is ever recorded against a repair job.
     ● The paused run is resumed by resume_workflow_after_review under conversation settings rebuilt from the thread_id
       stored on that run record, with decision, reviewer_name and feedback_text passed on exactly as received.
     ● A decision of config.REVIEW_DECISION_REJECT costs no further language model call and any other costs exactly one,
       bringing the run to config.EXPECTED_LLM_CALLS_PER_RUN, and the repair job returned is read back from the database
       with its final text and final status.
RETURNS
A RepairJobResponse for the repair job as it now stands.

get_review_history
ENDPOINT
GET /repairjobs/{repair_job_id}/reviews
FUNCTION SIGNATURE


get_review_history(repair_job_id, session)
PARAMETERS
    ● repair_job_id — taken from the path.
    ● session — a live database session supplied by the service from get_database_session.
PURPOSE
Return every decision recorded against one repair job, for the audit trail.
REQUIREMENTS
    ● An unknown repair_job_id is answered with status 404.
    ● The decisions are found through the repair job's own run_id using fetch_decisions_for_run, in oldest-to-newest order.
    ● A repair job that has not yet been reviewed answers with an empty list rather than a 404.
    ● No language model call.
RETURNS
A list of ReviewDecisionResponse.

get_call_budget
ENDPOINT
GET /runs/{run_id}/calls
FUNCTION SIGNATURE
get_call_budget(run_id, session)
PARAMETERS
    ● run_id — taken from the path.
    ● session — a live database session supplied by the service from get_database_session.
PURPOSE
Report how many language model calls one advisory run used, how long they took, and how many it should have used.
REQUIREMENTS
    ● A run_id absent from the database is answered with status 404.
    ● calls holds the entries fetch_call_records_for_run returns, in oldest-to-newest order as they were recorded.
    ● total_latency_milliseconds is the sum of the recorded latencies of those entries.
    ● expected_call_count is config.EXPECTED_LLM_CALLS_PER_RUN, reduced by one where a decision recorded against this
      run equals config.REVIEW_DECISION_REJECT, and this endpoint makes no call of its own.
RETURNS
A CallBudgetResponse for that run.

============== ACCESS CONTROL ===============


AssetGuard AI is used by three kinds of people who are trusted with very different things, and one of them can order a machine to
be shut down. This stage builds the two pieces that keep those differences real: the storage and checking of passwords, so that
no password is ever written down anywhere, and the rules that decide which parts of the service each role may reach. Every role
name, page name, area name, rounds count and byte count already exists in config/config.py, which is supplied, and must be
referred to by its constant rather than written out again. No function in this section needs a default parameter value; the caller
always passes what it wants.



﻿MODULE: access/password_security.py
Turns a password into something that is safe to keep in a database, and later says whether a password typed on the sign in form
is the same one. Nothing in the project ever stores or sends a password itself, so this module is the only place where a typed
password is handled at all. It also issues the tokens that stand for a signed in session, because a token has to be given out by the
service while a username can be typed by anyone.
FUNCTION SIGNATURE
create_password_salt()
PARAMETERS
None.
PURPOSE
Produce a fresh scrambling value that will be kept beside one account and mixed with that account's password.
REQUIREMENTS
    ● The amount of randomness in the value is set by config.PASSWORD_SALT_BYTES and by nothing written inside the
      function.
    ● Every call produces a different value, and the value is genuinely unpredictable rather than merely varied: seeing any
      number of earlier salts gives no help in working out the next one.
    ● Nothing about the account influences the result. The same value is as likely for one username, role or password as for any
      other.
    ● Each unit of randomness counted by config.PASSWORD_SALT_BYTES is written as two characters, so the text has one
      fixed length that never changes between calls.
    ● The text uses only plain digits and lower case letters, with no spaces, punctuation or accented characters, so it survives
      being stored in and read back out of an ordinary text column unchanged.
RETURNS
A single piece of text holding the new salt, ready to be saved in the account row alongside the stored password value.


FUNCTION SIGNATURE
create_password_hash(plain_password, password_salt)
PARAMETERS
plain_password — Text. The password as the person typed it, for example one of the passwords in
config.SEED_USER_ACCOUNTS when accounts are first created.
password_salt — Text. The salt kept against that account, as produced earlier by create_password_salt.
PURPOSE
Turn a password and its salt into the fixed, unreadable value that is stored in place of the password.
REQUIREMENTS
    ● The same password with the same salt always gives exactly the same result, otherwise a later sign in could never be
      checked.
    ● The same password with a different salt gives a completely different result, so two people who happen to choose the
      same password do not end up with the same stored value.
    ● The value cannot be turned back into the password. Holding both the stored value and the salt reveals nothing about what
      was typed.
    ● Changing a single character of the password changes the result beyond recognition, with no visible relationship between
      the two results.
    ● The mixing is repeated the number of times named by config.PASSWORD_HASH_ROUNDS, using the method named by
      config.PASSWORD_HASH_ALGORITHM. Neither the count nor the name appears anywhere in the function; both are read
      from config, so that raising the count later changes only that one line. The repetition is the protection: it makes each guess
      by an attacker slow, while one genuine sign in stays comfortably fast.
    ● The salt is taken as the run of raw values its text stands for, not as the characters used to write it down, so a salt counted
      in config.PASSWORD_SALT_BYTES contributes that many values and not twice as many.
    ● The password is handled in a way that copes with any character a person can type, including letters outside the English
      alphabet, rather than failing or losing information on them.
    ● The result is text of one fixed length, the same for a short password as for a long one, using only plain digits and lower
      case letters so it stores safely in a text column.
RETURNS
A single piece of text: the stored form of that password under that salt. This is what goes into the database, and the password
itself is never kept.

FUNCTION SIGNATURE
verify_password_matches(plain_password, stored_hash, stored_salt)
PARAMETERS
plain_password — Text. The password just typed on the sign in form.
stored_hash — Text. The value held against the account, as create_password_hash produced it when the account was created.
stored_salt — Text. The salt held against the same account.
PURPOSE
Say whether the password just typed is the one this account was set up with.
REQUIREMENTS
    ● The typed password is put through exactly the same treatment as when the account was created, with the account's own
      salt, and the outcome is compared with the stored value. Anything create_password_hash produced is therefore
      recognised.
    ● The answer is true only when the two values are identical in every character, and false for every other password, including
      one that differs only in its last character or only in capitalisation.
    ● The comparison takes the same amount of time whether the very first character differs or only the very last one. How long
      the answer takes must tell a watching attacker nothing about how much of a guess was right, so a comparison that stops
      early at the first difference is not acceptable.
    ● The stored password is never recovered, reconstructed or needed; only the stored value and the salt are read.
    ● An empty typed password is treated like any other wrong password and simply answers false.
    ● Nothing is written, logged or changed. Asking the question leaves the account exactly as it was.
RETURNS
A yes or no answer: true when the typed password matches the stored account, false otherwise.

FUNCTION SIGNATURE
create_session_token()
PARAMETERS
None.
PURPOSE
Issue a fresh secret value that stands for one successful sign in and is sent back by the dashboard on every later request.
REQUIREMENTS
    ● The amount of randomness in the token is set by config.SESSION_TOKEN_BYTES and by nothing written inside the
      function.
    ● The token is unpredictable. It is not a running count, a time, a username or anything derived from them, and holding one
      token gives no help in guessing another, because guessing a token would mean signing in as somebody else.
    ● Every call produces a different value, so two people signed in at the same moment never share a token.
    ● The token carries no readable trace of the account. Reading it must not reveal a username, a role or when it was issued.


    ● Each unit of randomness counted by config.SESSION_TOKEN_BYTES is written as two characters, giving one fixed length
      every time.
    ● The text uses only plain digits and lower case letters, so it travels safely in the request header named by
      config.SESSION_TOKEN_HEADER and stores safely in a text column.
RETURNS
A single piece of text holding the new session token, to be saved against the session row and handed back to whoever has just
signed in.



MODULE: access/permissions.py
Answers the two separate questions about what a role is allowed to do. The first is a matter of tidiness: which pages the
dashboard should draw in its sidebar. The second is the real control: whether the service should answer a request at all, which it
must decide for itself because anyone can call the service directly without going near the dashboard.

FUNCTION SIGNATURE
resolve_pages_for_role(role_name)
PARAMETERS
role_name — Text. The role of the signed in person, one of the roles listed in config.ROLE_OPTIONS, for example
config.ROLE_SUPERVISOR.
PURPOSE
List the dashboard pages this role is allowed to open, in the order the sidebar should show them.
REQUIREMENTS
    ● The pages allowed to a role are exactly those recorded against it in config.ROLE_PAGE_ACCESS, and no page is added,
      removed or renamed on the way out.
    ● The order is the order they are written in that table, because that is the sidebar order the dashboard draws.
    ● A role that has no entry in the table gets an empty list rather than an error, so a sign in left over from a role that no longer
      exists shows a bare dashboard instead of breaking it.
    ● The role name is matched exactly as written. A name that differs in capitalisation or carries extra spaces counts as
      unknown.
    ● What comes back can be added to or reordered by whoever receives it without changing the table in config, so the next
      call for the same role still gives the complete list.
RETURNS
A list of page names, such as config.PAGE_FLEET and config.PAGE_REVIEW, in sidebar order. The list is empty for a role the
table does not know.

FUNCTION SIGNATURE
check_role_may_open_area(role_name, area_name)
PARAMETERS
role_name — Text. The role of the signed in person, one of the roles in config.ROLE_OPTIONS.
area_name — Text. The area of the service the request is asking for, one of the area names such as config.AREA_REVIEW,
normally the answer just given by resolve_area_for_path.
PURPOSE
Say whether this role is allowed into this one area of the service.
REQUIREMENTS
    ● The answer is true only when that area is recorded against that role in config.ROLE_AREA_ACCESS, and false in every
      other case.
    ● A role with no entry in the table is refused everywhere. It is refused with a plain no, not with an error, so an unrecognised
      sign in is turned away rather than crashing the request.
    ● An area name the table does not recognise is refused for every role, including the empty text that resolve_area_for_path
      gives back for a path it cannot place.
    ● Both names are matched exactly as written, so a difference in capitalisation or spacing is a refusal rather than a match.
    ● The rule that matters most falls out of the table and must not be softened: config.ROLE_ENGINEER may reach
      config.AREA_ADVISORY but never config.AREA_REVIEW, because Safety Rule 02 says the person who raises a shutdown
      request may not be the person who approves it. This is a rule about who may decide, not about what is convenient to
      display.
    ● The answer depends on the two names given and nothing else. It does not consult the page list, the dashboard, or
      anything about the request beyond its area.
    ● Nothing is written or changed by asking.
RETURNS
A yes or no answer: true when the role may be let into that area, false when it may not.

FUNCTION SIGNATURE
resolve_area_for_path(request_path, request_method)
PARAMETERS
request_path — Text. The path part of an incoming request, for example a fleet listing path or a path for one machine with its
code on the end.
request_method — Text. How the request was made, written the way requests write it, such as "GET" for fetching something or
"POST" for submitting something.


PURPOSE
Work out which single area of the service a request belongs to, so that admission can then be decided for it.
REQUIREMENTS
    ● One case is settled first and on its own: a request that both was made by submitting ("POST") and whose path finishes
      with config.REVIEW_PATH_ENDING belongs to config.AREA_REVIEW, whatever the start of that path would otherwise
      have said. Submitting a decision is the one action Safety Rule 02 restricts, so it is placed by the action rather than by
      where it sits.
    ● The same path reached in any other way is not the review area. Looking at a review is not the same act as deciding on it,
      and only the deciding is restricted.
    ● Every other request takes its area from the beginning of its path, using config.AREA_BY_PATH_START, which pairs the
      opening of a path with the area it belongs to.
    ● A path is placed by how it begins, not by being identical to an entry, so a path carrying a machine code, an identifier or
      further parts after the opening still finds its area.
    ● The entries are considered in the order they are written, and the first whose opening matches decides.
    ● A path that matches no entry gives back empty text rather than a guess and rather than an error. That empty answer is
      refused for every role by check_role_may_open_area, so an unknown path is closed by default instead of open by default.
    ● Only the path and the method decide the answer. Nothing about the signed in person is looked at here; this function
      names the area, and check_role_may_open_area decides admission.
RETURNS
Text holding the name of the one area the request belongs to, such as config.AREA_FLEET or config.AREA_AUDIT, or empty text
when the path belongs to no known area.



MODULE: persistence/models.py — the user_accounts table
The access control section adds one table to the application database: the people who may sign in, and what their role lets them
see. It sits alongside the tables that record advisory runs, repair jobs, supervisor decisions, language model calls and manual
questions, and like them its column names are read by name across the repository, the web service and the dashboard, so they
are a data contract and must be spelled exactly as given. Nothing in this table is a password. Only the stored value
create_password_hash produced and the salt beside it are kept, so the database can be read from end to end without a single
password appearing anywhere in it.

TABLE
user_accounts
CLASS
UserAccount
PURPOSE
One row for each person who may sign in, holding who they are, what they are trusted with, the stored form of their password,
and the token of the session they are signed in with right now.
COLUMNS
    ● id — number; the automatically assigned primary key of the row.
    ● username — text; the name its owner types on the sign in form, unique across the table and the value every lookup by
      name matches against.
    ● display_name — text; the person's full name as the dashboard shows it in the sidebar.
    ● role — text; what this person is trusted with, one of config.ROLE_SUPERVISOR, config.ROLE_ENGINEER and
      config.ROLE_TECHNICIAN, and the single value from which both the page list and every admission decision follow.
    ● password_hash — text; the stored form of the password, as create_password_hash produced it. The password itself is
      never held here or anywhere else.
    ● password_salt — text; the scrambling value mixed into that password and kept beside it, as create_password_salt
      produced it, without which the stored value could never be checked again.
    ● session_token — text; the token of the session this account is signed in with, as create_session_token issued it. Empty
      text means nobody is currently signed in as this account, which is what signing out writes.
    ● created_at — timestamp; when the account was set up, stamped automatically as the row is created.



MODULE: persistence/repository.py — user accounts
Five functions covering everything the application ever does with an account: creating one at setup, finding one by the name its
owner types, finding one by the token it is signed in with, recording and clearing that token, and turning a saved row into a plain
record. Every function is handed an already open session, so the code that calls it decides when a session is opened and closed
and when work is saved, and none of them opens or closes one itself. Accounts are handed back as plain flat records rather than
as table rows, so the web service and the dashboard never depend on the shape of the table.

FUNCTION SIGNATURE
insert_user_account(session, account_record)
PARAMETERS
session — An open database session, from get_database_session or open_database_session.
account_record — Dictionary. A flat record of one account, carrying the keys "username", "display_name", "role", "password_hash"
and "password_salt", as run_database_setup.py builds it from one entry of config.SEED_USER_ACCOUNTS.
PURPOSE


Put one account on file so that person can sign in, and report which account is now on file.
REQUIREMENTS
    ● An account whose username is already in the table is left exactly as it stands. No column is overwritten, no second row
      appears, and the username is still reported back as though the save had just happened. This is what lets the database
      setup entry point be run a second time without wiping anybody's live session or replacing their stored password value.
    ● A new account is saved with the username, display name, role, stored password value and salt taken from account_record,
      and nothing else from that record reaches the table.
    ● The session token of a new account starts as empty text, because creating an account does not sign anybody in.
      Somebody who has never signed in and somebody who has signed out are in exactly the same state.
    ● created_at is stamped as the row is created rather than supplied by the caller.
    ● The saved row is read back from the database, so anything the database filled in is available to the caller rather than
      guessed.
    ● The save is complete and visible to any later read through any session by the time the function returns.
    ● No password ever reaches this function. It is handed the stored value and the salt already, so a password is never seen by
      the part of the project that writes to the database.
RETURNS
Text: the username of the account now on file, whether this call created it or found it already there.

FUNCTION SIGNATURE
fetch_user_by_username(session, username)
PARAMETERS
session — An open database session.
username — Text. The name typed on the sign in form, matched against the username column.
PURPOSE
Fetch one account by the name its owner types, so that a sign in attempt has something to be checked against.
REQUIREMENTS
    ● At most one account can be matched, because the username column holds no duplicates.
    ● A username the table does not hold gives back an empty record rather than an error. This is what lets sign_in_user answer
      an unknown username with exactly the same message as a wrong password.
    ● The name is matched exactly as given. A difference in capitalisation or a surrounding space makes it a username the table
      does not hold.
    ● What comes back is the plain flat record build_user_dictionary produces, not a table row, so nothing that calls this
      depends on the shape of the table.
    ● Nothing is written, stamped or changed. Asking leaves the account exactly as it was, including any live session it holds.
RETURNS
A flat record of that account, carrying its username, display name, role, stored password value, salt and current session token; or
an empty record when no account holds that username.

FUNCTION SIGNATURE
fetch_user_by_session_token(session, session_token)
PARAMETERS
session — An open database session.
session_token — Text. The token the caller sent in the request header named by config.SESSION_TOKEN_HEADER, as
create_session_token issued it at sign in.
PURPOSE
Work out which account a session token belongs to, so the service knows who is asking.
REQUIREMENTS
    ● Empty text is refused outright, before the table is consulted at all, and gives back an empty record. Signing out writes
      empty text into the account row, so without this refusal every signed out account in the table would be matched by a caller
      who simply sent nothing. That is the difference between nobody being signed in and everybody being signed in.
    ● A token no account holds gives back an empty record rather than an error, because an expired or invented token is an
      ordinary thing for the service to be sent.
    ● The token is matched exactly and in full. A value that shares only its opening characters with a stored token is not a
      match.
    ● At most one account can be matched, because one token stands for one session.
    ● What comes back is the plain flat record build_user_dictionary produces.
    ● Nothing is written. Identifying a caller does not refresh, extend or renew the session, and does not stamp anything against
      the account.
RETURNS
A flat record of the account currently holding that token; or an empty record when the token is empty or belongs to no account.

FUNCTION SIGNATURE
update_user_session_token(session, username, session_token)
PARAMETERS
session — An open database session.
username — Text. The account to change, matched against the username column.
session_token — Text. The token this account is now signed in with, or empty text to sign it out.
PURPOSE


Record the token an account is signed in with, and clear it again when that person signs out.
REQUIREMENTS
    ● Exactly one account is matched, by its username, and a username that is not in the table stops the caller with an error
      naming that username rather than silently doing nothing. Failing to record a token quietly would leave somebody who
      appeared to sign in unable to make a single request.
    ● Only the session_token column may be altered. The display name, the role, the stored password value, the salt and the
      creation time keep exactly the values they had.
    ● Empty text is an ordinary and expected value here, not a mistake to be rejected. It is how signing out is recorded, and it
      means nobody is signed in as this account.
    ● Writing a token replaces whatever was there before, so one account holds at most one live session and signing in again
      silently ends the earlier one.
    ● The change is complete and visible to any later read through any session by the time the function returns, because the
      very next request the dashboard makes will be checked against it.
RETURNS
Text: the username of the account whose token was written.

FUNCTION SIGNATURE
build_user_dictionary(user_row)
PARAMETERS
user_row — One saved account row, as read back from the user_accounts table.
PURPOSE
Turn one saved account row into a plain flat record, so that nothing outside this module depends on the shape of the table.
REQUIREMENTS
    ● The record carries exactly six entries, named "username", "display_name", "role", "password_hash", "password_salt" and
      "session_token", spelled that way, because they are read by name by the sign in endpoint and by the access guard.
    ● The creation time and the row's internal numbering are not carried across. Nothing that reads an account needs either of
      them.
    ● Every value is handed over exactly as it was stored, with no trimming, reformatting, capitalising, rounding or masking. A
      stored password value altered even slightly on the way out would never match again, and a role altered on the way out
      would change what its owner is allowed to reach.
    ● What comes back stands on its own. Changing it does not change the saved row, and it can still be read after the session
      it came from has been closed.
    ● Nothing is written or changed.
RETURNS
A flat record of the six values held against one account.



MODULE: api/schemas.py — the sign in request and reply
Two shapes carry a sign in. Both are named here because the service declares them by name and the marking suite reads them
back, so the spelling is a contract.

REQUEST SHAPE
SignInRequest — what the sign in form sends.
FIELDS
    ● username — text; the one word name the person types.
    ● password — text; the password as typed, sent once and never stored by the dashboard.
VALIDATION
    ● username is at least three characters, so an empty box is refused before any lookup is attempted.
    ● password is not empty.
    ● A request failing either check is refused with the status the service uses for a malformed body, and no account is looked
      up.

RESPONSE SHAPE
SignedInUserResponse — who signed in, what they may open, and the token to send from now on.
FIELDS
    ● username — text; the account that was signed in.
    ● display_name — text; the person's name as the sidebar shows it.
    ● role — text; one of config.ROLE_OPTIONS.
    ● session_token — text; the value the dashboard sends back on every later request.
    ● allowed_pages — list of text; the pages that role may open.
VALIDATION
    ● allowed_pages is decided by the service rather than by the dashboard, so the two can never disagree about what a role is
      permitted.
    ● The stored password never appears in the reply in any form.



MODULE: api/routes.py — signing in and the access guard
Two endpoints and two guards. Signing in has to be reachable before anybody is signed in, so the sign in and sign out endpoints
stand on their own, outside the guard, while every other endpoint in the service sits behind it. The guard itself is in two parts, and


the split matters: one part works out who the caller is from the token they sent, and the other decides whether that person's role
reaches the area the requested path belongs to. Both run before the endpoint body does, so an endpoint cannot be reached by
calling the service directly even when the dashboard has hidden the page that leads to it. Hiding a page is a convenience; this is
the control.

sign_in_user
ENDPOINT
POST /auth/signin
FUNCTION SIGNATURE
sign_in_user(sign_in_request, session)
PARAMETERS
sign_in_request — Dictionary. The submitted sign in details, carrying a username and a password exactly as the sign in form sent
them.
session — An open database session, supplied to the endpoint rather than opened inside it.
PURPOSE
Check a username and password, and when they are right issue the token that stands for this session.
REQUIREMENTS
    ● This endpoint is reachable without being signed in. It is one of only two outside the area guard, because nobody can be
      signed in before signing in.
    ● Details of the wrong shape, such as a username that is too short or a password that is empty, are refused as malformed
      before any account is looked up, so a blank form never reaches the database.
    ● The account is found with fetch_user_by_username, and the typed password is checked with verify_password_matches
      against the stored value and the salt held against that account.
    ● An unknown username and a wrong password are both refused with status 401 and with exactly the same wording,
      config.SIGN_IN_FAILED_MESSAGE. The two cases must be indistinguishable from outside, because a different message
      for an unknown username would confirm to a stranger which accounts exist.
    ● Nothing is written when the check fails. A failed attempt leaves the account exactly as it was, and any token that account
      already holds goes on working, so a stranger guessing at a password cannot sign anybody else out.
    ● After a successful check the account holds a fresh token, and the token handed back to the caller is that same one. A
      token that reached the caller but was never recorded against the account would be refused on their very next request.
    ● The list of pages in the reply is worked out by the service with resolve_pages_for_role, not by the dashboard, so the two
      can never disagree about what a role may see.
    ● The reply carries the username, the display name, the role, the new token and the allowed page list, and never the stored
      password value or the salt.
    ● The password is read here and nowhere else in the service. It is not written to the database, not recorded in the audit trail,
      and not repeated in the reply.
RETURNS
A record of who has just signed in, carrying username, display_name, role, session_token and allowed_pages.

sign_out_user
ENDPOINT
POST /auth/signout
FUNCTION SIGNATURE
sign_out_user(session, x_session_token)
PARAMETERS
session — An open database session.
x_session_token — Text. The token whose session is to be ended, sent in the request header named by
config.SESSION_TOKEN_HEADER.
PURPOSE
Clear a token so that it can never be used again, and report that it is done.
REQUIREMENTS
    ● This endpoint is reachable without being signed in, the second and last of the two outside the area guard. A caller holding
      a token the service no longer recognises must still be able to say they are finished.
    ● The account holding the token is found with fetch_user_by_session_token, and its token is cleared to empty text with
      update_user_session_token.
    ● A token no account holds, including an empty one, is treated as already signed out. The same confirmation is returned, no
      error is raised, and nothing is written. The caller wanted the session ended, and either way it is ended.
    ● The answer is the same whether the token was live or unknown, so signing out cannot be used to find out whether a
      guessed token belonged to somebody.
    ● The token stops working immediately. The very next request carrying it is refused by resolve_signed_in_user, because the
      empty text now held against the account matches nothing that any caller can send.
    ● Nothing about the account other than its token is altered, so the person can sign in again straight away and be given a
      fresh one.
RETURNS
A short record confirming that the caller is signed out.

FUNCTION SIGNATURE
resolve_signed_in_user(session, x_session_token)


PARAMETERS
session — An open database session.
x_session_token — Text. The token the caller sent in the request header named by config.SESSION_TOKEN_HEADER, which the
dashboard attaches to every call it makes.
PURPOSE
Turn the token a caller sent into the account it belongs to, so that every guarded endpoint knows who is asking without having to
find out for itself.
REQUIREMENTS
    ● The account is found with fetch_user_by_session_token, and that account is the caller for the rest of the request.
    ● A token that belongs to no account, including the empty text left behind by signing out, refuses the whole request with
      status 401 and a message telling the caller to sign in first. Nothing of the endpoint body runs.
    ● A request that carries no such header at all is refused before this is reached, so a caller who simply leaves the header off
      is never treated as an anonymous caller who is allowed through.
    ● Because the refusal happens before the endpoint body, no endpoint has to remember to check whether anybody is signed
      in, and no endpoint can be written that forgets to.
    ● This settles who the caller is and says nothing whatever about what they may do. Deciding that is require_area_access's
      work, and the two must stay separate, because being signed in and being allowed are different questions.
    ● Nothing is written. Identifying a caller does not touch the account.
RETURNS
The flat record of the signed in account, carrying at least its username, display name and role, for the guard and the endpoint to
use.

FUNCTION SIGNATURE
require_area_access(request, signed_in_user)
PARAMETERS
request — The incoming request, from which the path being asked for and the way it was made are read.
signed_in_user — Dictionary. The account the token belongs to, as resolve_signed_in_user has just identified it.
PURPOSE
Refuse the request outright unless the signed in role is allowed into the area that the requested path belongs to.
REQUIREMENTS
    ● The area is named by resolve_area_for_path from the request's path and the way it was made, and admission is then
      decided by check_role_may_open_area for the role on the caller's account. No rule about roles, paths or areas is written
      here; both answers come from the access package, so there is one place where the rules live and one place where they are
      applied.
    ● A role the table does not admit to that area is refused with status 403 and a message naming both the role and the area it
      was refused, so the person is told what happened rather than shown a blank failure.
    ● A path that belongs to no known area is refused for every role, because resolve_area_for_path gives back empty text for it
      and no role is admitted to empty text. An endpoint added later without an entry is therefore closed by default rather than
      open by default.
    ● This runs on every guarded endpoint in the service. Only the sign in and sign out endpoints stand outside it, and only
      because they must be reachable before anybody is signed in.
    ● Whether the dashboard drew a link to the page changes nothing here. A caller reaching the service directly, with a perfectly
      valid token but the wrong role, is refused exactly as if they had found a hidden page. The sidebar tidies what a person
      sees; this decides what the service will answer.
    ● Safety Rule 02 is what this finally enforces. A token belonging to config.ROLE_ENGINEER opens config.AREA_ADVISORY
      and is refused at config.AREA_REVIEW, so the person who raises a shutdown request cannot approve it by calling the
      service directly, and there is no route by which they could.
    ● Nothing is written and nothing about the request is altered. It is either passed through untouched or refused.
RETURNS
The same flat account record it was given, so the endpoint can use it, when the caller is admitted. When the caller is refused, the
endpoint is never reached at all.



MODULE: dashboard/api_client.py — signing in
The three functions in the dashboard's single point of contact with the service that concern the session itself: the one that names
who is asking on every other call, the one that starts a session, and the one that ends it. Every call is addressed to the service at
config.API_BASE_URL and bounded by config.API_REQUEST_TIMEOUT_SECONDS, with no other address and no other limit
written anywhere in the dashboard. The dashboard holds no account table and checks no password of its own.

FUNCTION SIGNATURE
build_request_headers()
PARAMETERS
None.
PURPOSE
Build the headers that every call to the service carries, so the service knows who is asking.
REQUIREMENTS
    ● Exactly one header is produced, named by config.SESSION_TOKEN_HEADER, carrying the token being held for this
      browser tab. The header name is never written out here; changing it in config must change it everywhere.


    ● The token is read from where the dashboard remembers things for one browser tab, put there by render_sign_in_page
      when the sign in succeeded. It is never read from a file, an environment value or anything shared between tabs, so closing
      the tab ends the session and leaves nothing behind on disk.
    ● When no token is being held, the header is still present, carrying empty text, rather than being left off. The service refuses
      an empty token, so a page somehow reached before signing in is refused for the right reason rather than failing in some
      other way.
    ● Every call in this module that reaches a guarded endpoint carries these headers. Signing in is the only call that goes
      without them, because there is no token to send yet.
    ● Nothing else about the person travels: no username, no display name, no role and above all no password. The token alone
      identifies the caller, and the service looks the rest up for itself.
RETURNS
A record of headers, ready to be attached to a call to the service.

FUNCTION SIGNATURE
sign_in_user(username, password)
PARAMETERS
username — Text. What was typed in the username box of the sign in form, already stripped of surrounding spaces by
render_sign_in_page.
password — Text. What was typed in the password box, exactly as typed.
PURPOSE
Offer a username and password to the service and bring back the signed in account when they are accepted.
REQUIREMENTS
    ● The details are submitted to the sign in endpoint at config.API_BASE_URL, bounded by
      config.API_REQUEST_TIMEOUT_SECONDS.
    ● The two values travel under the names username and password, spelled exactly that way, because the service will not
      read them under any other name.
    ● No headers are attached, because there is no token to send until this call has succeeded.
    ● A refusal by the service, status 401, comes back as an empty record rather than as a failure, so the form can show one
      plain message without having to know anything about status codes.
    ● Any other unsuccessful reply reaches the caller as a failure rather than as an empty record, so a service that is not running
      is never mistaken for a wrong password and the person is told the truth about which has gone wrong.
    ● What the service sent is handed over exactly as it arrived, with nothing reshaped, filtered, reordered or added. In particular
      the page list is the service's answer and is not adjusted here.
    ● The password is sent once and then forgotten. It is never kept for this tab, never put in a header, and never sent again on
      any later call.
RETURNS
A record of the signed in account, carrying username, display_name, role, session_token and allowed_pages; or an empty record
when the details were not accepted.

FUNCTION SIGNATURE
sign_out_user()
PARAMETERS
None.
PURPOSE
Tell the service to forget the token this browser tab is holding.
REQUIREMENTS
    ● The request is submitted to the sign out endpoint at config.API_BASE_URL, bounded by
      config.API_REQUEST_TIMEOUT_SECONDS.
    ● The token travels in the headers from build_request_headers, and there is nothing else to send, because the token is the
      only thing that says which session is being ended.
    ● An unsuccessful reply reaches the caller as a failure rather than as a quiet success, so a sign out that did not actually
      happen is never reported as though it had, and the person is not left believing a live token has been cleared.
    ● Nothing that the dashboard is holding is cleared by this function. Forgetting the token on the dashboard side is
      render_signed_in_sidebar's work, and it does that only after this call has come back successfully, so the service and the
      dashboard never disagree about whether the session is over.
RETURNS
A yes answer confirming that the service was told.



MODULE: run_dashboard.py — the sign in page and the sidebar
The two pieces of the dashboard entry point that carry the session: the form nobody gets past until they sign in, and the sidebar
that then shows only the pages the signed in role allows. Both live in the entry point rather than in a page module, because they
run before any page does and they decide which page runs at all. Nothing is drawn and no call is made to the service until
somebody has signed in.

FUNCTION SIGNATURE
render_sign_in_page()
PARAMETERS


None.
PURPOSE
Draw the sign in form and, when the details are accepted, keep for this browser tab everything the rest of the dashboard needs to
know about the person.
REQUIREMENTS
    ● This is the only thing on screen until somebody is signed in, and no call to the service is made before the form has been
      submitted.
    ● The form takes a username and a password, and the password is masked as it is typed rather than shown on screen.
    ● Both boxes are submitted together by a single button, so the service is asked once per attempt rather than once for every
      character typed.
    ● Nothing happens until that button is pressed. Simply drawing the page attempts no sign in.
    ● Surrounding spaces are stripped from the username before it is sent, because they are almost always a typing slip; the
      password is sent exactly as typed, because a space may be part of it.
    ● The details go to the service through sign_in_user in dashboard/api_client.py. The dashboard checks no password of its
      own, holds no account table, and applies no rule about who may sign in.
    ● An empty record coming back shows config.SIGN_IN_FAILED_MESSAGE and nothing more, and the person stays on the
      form. The same wording covers an unknown username and a wrong password, matching what the service decided, so
      nothing here reveals which of the two it was.
    ● A successful sign in keeps exactly three things for this browser tab: the session token, the display name and the role. The
      token is kept there and nowhere else, so closing the tab ends the session and nothing is left behind on disk.
    ● The password is not kept, and neither is the stored password value nor the salt, neither of which the service sends.
    ● With those three values held, what is on screen is the sidebar and the person's first page rather than the form, and nothing
      further is asked of them to bring that about.
RETURNS
Nothing; it draws the form, and on success replaces it with the signed in dashboard.

FUNCTION SIGNATURE
render_signed_in_sidebar()
PARAMETERS
None.
PURPOSE
Draw the sidebar for the person who is signed in, and report back which page they have chosen.
REQUIREMENTS
    ● The sidebar opens with config.DASHBOARD_TITLE and config.DASHBOARD_SUBTITLE, then the display name and the
      role that were kept for this tab when the person signed in, so it is always clear who is signed in and what they are trusted
      with.
    ● The pages offered are exactly those resolve_pages_for_role gives back for that role, in exactly that order. No page list is
      written here, so a config.ROLE_TECHNICIAN never sees a config.PAGE_REVIEW entry to click at all.
    ● Each entry carries the one line held against it in the module level PAGE_DESCRIPTIONS, matched to the pages by name so
      the lines stay with the right entries whatever a role's list contains. The lines are what makes the sidebar read as a workflow
      rather than as a set of unrelated screens.
    ● Exactly one page is chosen at a time, and that choice is what the function reports back.
    ● The sidebar ends with a sign out control, and nothing at all is placed below it, because anything added after it lands below
      the fold where nobody finds it.
    ● After sign out, three things are true together: the service has been told through sign_out_user in dashboard/api_client.py,
      this tab holds nothing it was holding before including the token, and what is on screen is the sign in form. A tab cleared
      without the service being told would leave a live token recorded against the account.
    ● Leaving a page out of the sidebar is a convenience only. It is require_area_access in the service that refuses the matching
      endpoint, so a page the sidebar never offers cannot be reached by calling the service directly either.
RETURNS
Text: the name of the page the person has chosen, one of the page names listed for their role in config.ROLE_PAGE_ACCESS,
which the entry point uses to decide which page to draw.

============== MANUAL CHAT =============


The manual chat is the one page a Technician is allowed to open, and it exists for the person standing in front of a machine with
a question the documents can settle: how a repair is carried out, which permit it needs, which part to order, or how the machine in
front of them is doing. It answers only from the Meridia machine manuals, safety rules and policies that were indexed by
run_knowledge_indexing.py, and refuses anything those documents do not cover rather than falling back on general engineering
knowledge, because an instruction that is not in a Meridian document must never reach a technician. Exactly one language
model call is made for each question asked, whatever the person types: a question about a torque figure, a question about one
machine's condition and a question about the weather all cost the same single call, because that one call both decides what kind
of question it is and answers it. The conversation itself lives in the browser tab and travels with each question, so the service
keeps no conversation of its own, two people chatting at the same time cannot see each other's questions, and closing the tab
ends the conversation.
Every question type, turn limit, distance limit and fixed message already exists in config/config.py, which is supplied. No function
in this section needs a default parameter value; the caller passes the constant it needs.


MODULE: chat/conversation_memory.py
Holds the short conversation memory that makes a follow up question mean something on its own. It keeps the last few
exchanges, builds the single piece of text the manuals are searched with, and lays those same exchanges out as readable text for
the assistant. It stores nothing of its own: every function is handed the history the browser sent and hands something back.

FUNCTION SIGNATURE
trim_conversation_history(conversation_history, turn_limit)
PARAMETERS
conversation_history — List of dictionaries. The earlier exchanges of this one conversation exactly as the browser sent them,
oldest first, each entry holding the question that was asked and the answer that was given.
turn_limit — Number. How many of the most recent exchanges may be kept, from config.CHAT_HISTORY_TURN_LIMIT.
PURPOSE
Keep only the most recent exchanges of a conversation and drop everything older, so that a follow up question still makes sense
while the prompt does not fill up with old conversation.
REQUIREMENTS
    ● A history holding no more exchanges than turn_limit allows must come back whole, with nothing dropped.
    ● A longer history must keep the most recent exchanges only, the ones nearest the end of the list, and drop the older ones.
    ● The exchanges that survive must stay in the order they happened, the oldest of them first and the most recent last.
    ● An empty history must come back as an empty result rather than as a failure.
    ● Whole exchanges are dropped and nothing else. No entry is read into, rewritten, reordered or replaced.
    ● The list passed in must be as it was, the shortened history being a separate list, so the caller can still see everything it was
      sent.
RETURNS
A list holding at most as many exchanges as turn_limit allows, in the order they happened.

FUNCTION SIGNATURE
build_search_text(conversation_history, question_text)
PARAMETERS
conversation_history — List of dictionaries. The recent exchanges left by the trimming step of this module, each holding the
question that was asked and the answer that was given.
question_text — Text. The question the person has just asked.
PURPOSE
Join the recent questions to the new one to make the single piece of text that the manuals are searched with.
REQUIREMENTS
    ● Only the earlier questions may be used. The earlier answers must be left out, because an answer is several hundred words
      of manual text that would drown the new question out.
    ● The earlier questions must appear in the order they were asked, with the new question last.
    ● The pieces must be joined into one continuous run of text with a single space between them, and with no labels,
      punctuation or decoration added around them.
    ● An empty history must give the new question on its own, unchanged.
    ● Nothing may be shortened, reworded or re-cased; every question travels exactly as it was typed.
RETURNS
One piece of text holding the recent questions followed by the new one, ready to be searched with.

FUNCTION SIGNATURE
format_history_for_prompt(conversation_history)
PARAMETERS
conversation_history — List of dictionaries. The recent exchanges left by the trimming step of this module, each holding the
question that was asked and the answer that was given.
PURPOSE
Lay the recent exchanges out as readable text that can be shown to the assistant as the conversation so far.
REQUIREMENTS
    ● An empty history must give a short line saying that this is the first question in the conversation, never an empty piece of
      text, so the prompt never carries a blank section whose meaning the model has to guess.
    ● Every exchange that is present must show both what was asked and what was answered, each marked so that the two
      cannot be mistaken for one another.
    ● The exchanges must read oldest first, and be separated clearly enough that two exchanges are not read as one.
    ● The wording of every question and every answer must appear as it was, with nothing summarised, shortened or reworded.
RETURNS
One piece of text holding the recent conversation, or a short line saying there is none yet.



MODULE: chat/machine_status_answer.py
Answers a question about one machine's condition from the fleet data and the trained breakdown model rather than from the
manuals, because that answer is a fact rather than something a document says. No language model is called anywhere in this
module; both functions write a fixed piece of text out of values they were handed. One machine at a time, named by its code,
because a role that is not allowed the Fleet overview page must not be able to rebuild the fleet one question after another.


FUNCTION SIGNATURE
build_machine_status_answer(machine_profile, risk_facts)
PARAMETERS
machine_profile — Dictionary. The record of one live machine as it was looked up in the current fleet file, holding its code, its kind,
its factory, its importance and its latest readings.
risk_facts — Dictionary. What has been worked out about that same machine: the chance it breaks down in the next 30 days, the
risk band that chance falls in, and the repair priority that follows from the band and the machine's importance.
PURPOSE
Write the condition of one machine as a short piece of text that a technician standing at that machine can act on.
REQUIREMENTS
    ● The machine must be identified by its code, and its kind, its factory and its importance must all appear, so the reader can
      confirm the answer is about the machine in front of them.
    ● The chance of breaking down must appear, said plainly to be for the next 30 days, together with the risk band it falls in and
      the repair priority that goes with it.
    ● The latest readings must appear: the average vibration, the average temperature, the oil dirtiness score, how many alarms
      there were this week, and how many days it has been since the last service.
    ● The vibration and the temperature must carry their units, because a bare number is not a reading a technician can judge.
    ● Every value must be written as it was handed in. Nothing is recalculated, re-banded, rounded or reworded here.
    ● The text must fall into separate short blocks — what the machine is, what the risk is, what the readings are — rather than
      run together as one paragraph.
    ● Only the one machine may be described. No other machine, no fleet count and no comparison against the rest of the fleet
      may appear.
    ● No language model call is made.
RETURNS
One piece of text describing that machine, its risk and its latest readings.

FUNCTION SIGNATURE
build_unknown_machine_answer(machine_code)
PARAMETERS
machine_code — Text. The machine code that was looked for and not found, which is empty when the question named no
machine at all.
PURPOSE
Tell the person that the machine they asked about could not be found, and let them see what was actually looked up.
REQUIREMENTS
    ● An empty code must be answered by asking the person which machine they mean and telling them to name it by its code,
      with an example of what a code looks like, because nothing was found only because nothing was asked for.
    ● A code that was given but not matched must be answered with config.CHAT_UNKNOWN_MACHINE_MESSAGE, followed
      by the code that was tried, so that a code typed one character wrong can be seen to be wrong.
    ● The wording of config.CHAT_UNKNOWN_MACHINE_MESSAGE must be used as it stands, neither reworded nor replaced.
    ● The two cases must be told apart by whether a code was given at all, not by whether the code that was given looks well
      formed.
    ● No language model call is made, and no similar or nearby machine code is offered as a guess.
RETURNS
One piece of text saying the machine was not recognised and naming the code that was tried, or asking which machine was
meant.



MODULE: chat/manual_assistant.py
Answers one question from the machine manuals. The manuals are searched first, which costs no language model call at all, and
only then is a single call made, one call that does two jobs at once and so holds the cost at exactly one call per message
whatever the person types. A third function is the safety net: it decides, without trusting what the model said, whether an answer
taken from the manuals is close enough to the question to be given at all.

FUNCTION SIGNATURE
retrieve_manual_context(manual_search, search_text)
PARAMETERS
manual_search — Dictionary. The search handle opened once by tools/retrieval_tools.py, carrying the indexed collection to
search and the model that turns text into numbers.
search_text — Text. The recent questions joined to the new one by chat/conversation_memory.py.
PURPOSE
Search the indexed Meridian documents for the passages that best match the question, and report how close the closest of them
came.
REQUIREMENTS
    ● The record must carry exactly the keys "context_text", "source_documents", "closest_distance" and "chunk_count".
    ● The search must ask for config.RETRIEVAL_RESULT_COUNT passages.
    ● The question must be turned into numbers by the model carried in manual_search, which is the model that built the index;
      a comparison against numbers produced by any other model is meaningless.


    ● "context_text" must be the retrieved passages laid out as one readable block, each passage labelled with the document it
      came from and none of them reworded, shortened or merged.
    ● "source_documents" must name each contributing document a single time, in the order the documents first appear among
      the passages, and "chunk_count" must be how many passages were actually found.
    ● "closest_distance" must be the distance of the closest passage found, because that is what lets the caller tell "the
      manuals answer this" apart from "nothing in the manuals is about this at all".
    ● An empty store, meaning the indexing entry point has not been run yet, must not end the request. It must report empty text,
      no documents, no passages, and a distance beyond config.CHAT_MAX_RELEVANCE_DISTANCE, which sends the request
      down the refusal path. That is the truthful answer: nothing in the manuals covers this, because there are no manuals
      loaded.
    ● No language model call is made.
RETURNS
A record of the retrieved manual text, the documents it came from, how far away the closest passage was, and how many
passages were used.

FUNCTION SIGNATURE
answer_manual_question(question_text, history_text, manual_context)
PARAMETERS
question_text — Text. The question the person has just asked.
history_text — Text. The recent conversation laid out for reading by chat/conversation_memory.py.
manual_context — Dictionary. The record of what the manual search found, produced by the search step of this module.
PURPOSE
Make the single language model call that decides what kind of question this is and answers it from the passages that were
found.
REQUIREMENTS
    ● Exactly one language model call is made, whatever the question turns out to be about, and it is made under the agent
      name config.AGENT_NAME_MANUAL_ASSISTANT so that the call is recorded against this assistant and not against one
      of the advisory agents.
    ● The assistant must be given the recent conversation, the new question and the retrieved passages, and told plainly that
      only those passages may be used, and that it must say so when they do not answer the question rather than answering
      from general engineering knowledge, because an instruction that is not in a Meridian document must never be acted on.
    ● The assistant must be made to place the question in exactly one of the five kinds listed in config.CHAT_TYPE_OPTIONS,
      each described well enough that a repair question, a permit question, a parts question, a question about one named
      machine's condition, and a question the Meridian documents do not cover, each land in the right one.
    ● The machine code the question is about must be asked for in the same call, because a question about one machine has to
      be answered from the fleet data rather than from the manuals, and recovering the code here saves a second call. A
      question that names no machine must be able to say so.
    ● A written answer is expected only for the three kinds the manuals answer. For a question about one machine's condition,
      and for a question the documents do not cover, no answer is expected from the model, because neither is answered from
      the manuals.
    ● The reply must be asked for as labelled lines and read back the same way, recovering four pieces of information: the kind
      of question, the machine code, the written answer, and the document the answer came from.
    ● Those four pieces must be carried back under the labels they were asked for — QUESTION TYPE, MACHINE ID, ANSWER
      and SOURCE — alongside the record of the call itself under "call_record", because the chat endpoint reads them all by
      those names.
    ● A piece the reply failed to label must arrive as empty text rather than ending the request, because the endpoint can work
      around a missing value but not around a crash.
RETURNS
A record holding the kind of question, the machine code, the written answer, the document it came from, and the record of the
one call that produced them.

FUNCTION SIGNATURE
check_answer_is_grounded(question_type, closest_distance)
PARAMETERS
question_type — Text. The kind of question the one call came back with, expected to be one of the five in
config.CHAT_TYPE_OPTIONS.
closest_distance — Number. How far away the closest retrieved passage was, taken from the record the search step of this
module produced.
PURPOSE
Decide whether an answer taken from the manuals sits close enough to the question to be trusted, without depending on the
assistant having done as it was told.
REQUIREMENTS
    ● Only the three kinds that are answered from the manuals are checked at all: config.CHAT_TYPE_PROCEDURE,
      config.CHAT_TYPE_SAFETY and config.CHAT_TYPE_PARTS.
    ● Every other kind must pass, including a kind that is not one of the five at all, because its answer never came from the
      manuals and there is nothing to hold it against.
    ● For the three that are checked, the answer passes only when the closest passage is no further away than
      config.CHAT_MAX_RELEVANCE_DISTANCE. A distance sitting exactly on that limit is close enough.


    ● The decision must rest on the kind of question and the distance alone. The answer text is never read, and a confident
      sounding reply earns no allowance, because the whole point of the check is that it does not depend on the model having
      obeyed its instructions.
    ● The result must be a plain yes or no. What to do about a failed check, including putting config.CHAT_REFUSAL_MESSAGE
      in place of the answer, belongs to the caller.
RETURNS
A yes or no: yes when the answer may stand, no when it must be dropped however confident the reply sounded.



MODULE: persistence/models.py — the chat_turns table
The five tables the rest of the project uses are defined elsewhere in this same module. A sixth is added here for the manual chat.
A technician who acts on an answer is doing something as consequential as a supervisor approving a repair job, so the same rule
applies to both: it is written down, and if a job later goes wrong this is where you find out what the person was told. The column
names are read by name by the repository, the web service and the dashboard, so they are a data contract and must be spelled
exactly as given.

TABLE
chat_turns
CLASS
ChatTurnRecord
PURPOSE
One row for each question put to the manual assistant, and what it answered.
COLUMNS
    ● id — number; the automatically assigned primary key of the row.
    ● username — text; the account that asked the question, so every answer has a named person against it.
    ● question — text; the question exactly as it was typed, neither tidied nor shortened.
    ● question_type — text; which of the kinds in config.CHAT_TYPE_OPTIONS the question was settled as, including
      config.CHAT_TYPE_OUT_OF_SCOPE for one that was refused.
    ● answer — text; the answer that was actually shown to the person, a refusal being recorded exactly as fully as an answer.
    ● source_documents — text; the documents the answer came from, held as one piece of text rather than as a list, and empty
      when the answer came from no document at all.
    ● machine_code — text; the machine the question was about, and empty when the question named none.
    ● latency_milliseconds — number; how long the one language model call took, so the chat can be costed the same way an
      advisory run is.
    ● asked_at — timestamp; when the question was asked, stamped automatically as the row is created.



MODULE: persistence/repository.py — chat turns
The saves and reads for the chat log, sitting alongside the ones for runs, repair jobs, decisions, calls and accounts already in this
module. They follow the same rules as the rest: each is handed an already open session and never opens or closes one itself, and
each hands rows back as plain flat records so that the web service and the dashboard never depend on the shape of the table.

FUNCTION SIGNATURE
insert_chat_turn(session, chat_record)
PARAMETERS
session — An open database session, from get_database_session or open_database_session.
chat_record — Dictionary. A flat record of the exchange to save, carrying at least the keys "username", "question", "question_type",
"answer", "source_documents", "machine_code" and "latency_milliseconds".
PURPOSE
Write one question and the answer it was given into the permanent chat log.
REQUIREMENTS
    ● Only those seven keys may be taken from chat_record, and a record carrying extra keys must save cleanly with the extras
      ignored rather than fail or write them.
    ● asked_at must be stamped by the database as the row is created, never taken from chat_record, so the time cannot be
      supplied or altered by the caller.
    ● Whatever the answer says goes in. A refusal is written down as fully as an answer, because what the person was told is
      the point of the record, and an assistant that declined to help is itself worth knowing about.
    ● Nothing is judged, rewritten, shortened or filtered on the way in. The row must hold what the caller settled on.
    ● The saved row must be re-read from the database so that anything the database filled in is available to the caller.
    ● The save must be complete and visible to any later read through any session by the time the function returns.
RETURNS
The row identifier of the saved exchange.

FUNCTION SIGNATURE
fetch_recent_chat_turns(session, turn_limit)
PARAMETERS
session — An open database session.


turn_limit — Number. How many of the most recent exchanges are wanted, in practice config.CHAT_AUDIT_RECENT_ROWS
when the audit trail asks and never more than config.CHAT_AUDIT_MAX_ROWS.
PURPOSE
Read the most recently asked questions back out of the chat log for the audit trail.
REQUIREMENTS
    ● The list must run newest first by asked_at, because the audit page opens on what was asked most recently.
    ● No more than turn_limit exchanges may come back, and the ones that do must be the most recent that exist. Where the
      log holds fewer than that, all of them come back.
    ● Every exchange in the log is a candidate whoever asked it. This is the record of what the assistant has been telling people,
      so it is never narrowed to one account.
    ● Every entry must have the shape build_chat_turn_dictionary defines.
    ● An empty log must give an empty list rather than an error.
    ● Whether turn_limit is a sensible number at all is the caller's business, checked before the request reaches here.
RETURNS
A list of the most recent exchanges, newest first.

FUNCTION SIGNATURE
build_chat_turn_dictionary(chat_row)
PARAMETERS
chat_row — One saved chat row, as read from the chat_turns table.
PURPOSE
Translate one stored exchange into the flat record the web service and the audit trail read.
REQUIREMENTS
    ● The record must carry exactly the keys "username", "question", "question_type", "answer", "source_documents",
      "machine_code", "latency_milliseconds" and "asked_at".
    ● The row's own identifying number must not be carried, because nothing outside the table refers to a chat row by number.
    ● "asked_at" must be carried through as the moment in time it holds, not flattened into text, because the reply shape it feeds
      declares it as a moment and the dashboard shortens it for reading.
    ● Every other value must appear exactly as stored, with nothing rounded, reworded, re-cased or shortened, and
      "source_documents" staying the one piece of text the row holds rather than being split back into a list.
    ● Nothing is read from the database here. The function is handed a row and hands back a record, so it needs no session of
      its own.
RETURNS
A flat record of one saved exchange.



MODULE: api/schemas.py — the chat request and reply
Three shapes carry the chat over HTTP, and they sit alongside the advisory and review shapes already defined in this module. The
same rule applies to all of them: a value that is wrong is refused on the way in, before any search is run and before any language
model call is made, so a malformed question costs nothing at all.

ChatRequest
REQUEST SHAPE
ChatRequest — one question for the manual assistant, together with the recent conversation it belongs to.
FIELDS
    ● question — text; the question the person has just typed.
    ● history — list; the earlier exchanges of this one conversation, oldest first. Each entry is a supporting shape named
      ChatTurn carrying exactly two text fields, question and answer, spelt that way because the endpoint reads them by those
      names.
VALIDATION
    ● question shorter than two characters is refused, because a single character is not a question anybody can search the
      manuals with.
    ● history must be present, but an empty list is perfectly valid and is what the first question of any conversation carries.
    ● An entry of history missing either question or answer is refused rather than filled in with a blank, because a half-recorded
      exchange would mislead the assistant about what has already been said.
    ● The conversation travels with every question rather than being kept by the service, so the service holds no conversation of
      its own, two people chatting at the same time cannot see each other's questions, and closing the tab ends the
      conversation.
    ● Every refusal carries status 422 and happens before the manuals are searched, so a refused request never reaches the
      language model.

ChatResponse
RESPONSE SHAPE
ChatResponse — what the assistant answered, and where the answer came from.
FIELDS
    ● question_type — text; which of the kinds in config.CHAT_TYPE_OPTIONS the question was settled as.
    ● answer — text; the answer to show, which may be the refusal wording from config.CHAT_REFUSAL_MESSAGE.
    ● source_documents — list of text; the documents the answer was taken from.
    ● chunks_searched — number; how many manual passages the search actually found.


VALIDATION
    ● All four fields are always present. An answer that came from no document says so with an empty source_documents,
      never by leaving the field out, so the dashboard never has to guess whether a missing list means none were found or none
      were reported.
    ● source_documents is a list here, unlike the single piece of text the same information is stored as in the chat log.
    ● chunks_searched is a whole number, and reports what the search found rather than what the answer used, so it is still
      reported for an answer that came from the fleet data and for a refusal.

ChatTurnResponse
RESPONSE SHAPE
ChatTurnResponse — one recorded question and its answer, as the audit trail reads it.
FIELDS
username, question, question_type, answer, source_documents, machine_code, latency_milliseconds, asked_at.
VALIDATION
    ● The first six fields are text and latency_milliseconds is a whole number.
    ● source_documents is one piece of text here rather than a list, because that is how the row was stored and the audit trail
      shows it as it stands.
    ● asked_at is a moment in time rather than text, so it travels in a standard machine readable form that the dashboard
      shortens for reading.
    ● The shape is built from the record fetch_recent_chat_turns returns, and the row's own identifying number is not declared
      and does not appear.



MODULE: api/routes.py — asking the assistant
Two endpoints complete the chat, and they sit on the guarded router with every other endpoint in this module, so each is refused
unless the signed in role may open the area its path belongs to. One of them is the only endpoint in the whole service besides the
advisory and review endpoints that costs a language model call, and it costs exactly one. The other only reads the chat log and
costs nothing.

ask_manual_assistant
ENDPOINT
POST /chat/ask
FUNCTION SIGNATURE
ask_manual_assistant(chat_request, signed_in_user, session)
PARAMETERS
chat_request — the request body, validated against the ChatRequest shape.
signed_in_user — Dictionary. The account the session token belongs to, resolved by the service before the endpoint body runs.
session — a live database session supplied by the service from get_database_session.
PURPOSE
Answer one question from the machine manuals, or from the fleet data where it is about one machine, and record what was
asked and what was answered.
REQUIREMENTS
    ● Exactly one language model call is made, whatever the question turns out to be about. Searching the manuals costs
      nothing, and the one call both settles what kind of question this is and answers it, so a procedure question, a question
      about one machine and a question about the weather all cost the same.
    ● The conversation the manuals are searched with carries at most config.CHAT_HISTORY_TURN_LIMIT exchanges,
      reduced to the plain question-and-answer pairs the conversation memory works in, so nothing beyond that limit reaches
      either the search or the call.
    ● The text the manuals are searched with, and the readable conversation the assistant is shown, are both produced by
      chat/conversation_memory.py rather than assembled here.
    ● The kind of question is read from the reply with surrounding blanks removed and its letters raised to capitals, and anything
      that is still not one of config.CHAT_TYPE_OPTIONS becomes config.CHAT_TYPE_OUT_OF_SCOPE, so an unrecognised
      answer is refused rather than passed on as a new category.
    ● The machine code is read from the reply with surrounding blanks removed, and a reply saying it names none, in any
      combination of letter cases, is treated as no machine at all.
    ● A question settled as config.CHAT_TYPE_MACHINE_STATUS is answered from the fleet loaded at module load from
      config.CURRENT_FLEET_FILE and from the breakdown model, never from the manuals: no document may be reported
      against it, an unrecognised or absent code is answered by the unknown machine wording, and a machine that is found is
      scored, banded against the configured thresholds and given the priority its importance and band call for before its
      condition is written out. This path adds no second call.
    ● Any other question is refused where the kind is already config.CHAT_TYPE_OUT_OF_SCOPE, or where the grounding
      check fails against config.CHAT_MAX_RELEVANCE_DISTANCE. A refusal must be complete: the kind becomes
      config.CHAT_TYPE_OUT_OF_SCOPE, the answer becomes config.CHAT_REFUSAL_MESSAGE, the document list is
      emptied and the machine code is cleared, so nothing is left beside a refusal that would suggest it was answered after all.
    ● Every question and answer is written to the chat log before the reply is returned, and it is the settled values that are written:
      the account name of the signed in person rather than anything the caller sent, the question exactly as typed, the kind after
      any correction, the answer that will actually be shown, the documents joined into one piece of text, the machine code, and
      how long the one call took as its own call record reports it.


    ● The reply reports how many passages the search found whatever path the answer came down, because that figure
      describes what was searched rather than what was used.
    ● A body that fails validation is refused with status 422 before anything is searched, and a request arriving without a usable
      session token is refused before the body runs at all.
RETURNS
A ChatResponse carrying the kind of question, the answer, the documents it came from and the number of passages searched.

list_recent_chat_turns
ENDPOINT
GET /audit/chat-turns
FUNCTION SIGNATURE
list_recent_chat_turns(turn_limit, session)
PARAMETERS
turn_limit — a query value naming how many of the most recent exchanges are wanted, spelt exactly that way.
session — a live database session supplied by the service from get_database_session.
PURPOSE
Return the questions the manual assistant was asked most recently, so the audit trail can show what technicians have been told.
REQUIREMENTS
    ● A turn_limit below one, or above config.CHAT_AUDIT_MAX_ROWS, is refused with status 422 and a message naming the
      range that was allowed, so a single request cannot be made to drag the whole log out of the database.
    ● An accepted turn_limit answers with status 200, newest first, in the order fetch_recent_chat_turns establishes and with no
      re-sorting here.
    ● Every recorded question is in scope whoever asked it, because this is the audit view of the assistant rather than one
      person's own history.
    ● This endpoint sits under the audit area rather than the chat area, so a role that may ask the assistant questions is not
      thereby able to read everybody else's.
    ● An empty log answers with an empty list rather than a 404.
    ● No language model call is made.
RETURNS
A list of ChatTurnResponse entries, newest first.



MODULE: dashboard/api_client.py — the chat calls
Two more calls on the single point of contact between the dashboard and the service, alongside the sign in, fleet, machine,
advisory and review calls already in this module. The same rules hold: each is addressed to config.API_BASE_URL and bounded
by config.API_REQUEST_TIMEOUT_SECONDS, each carries the headers that name who is asking so that the service does not
answer with a refusal to say who that is, and neither reshapes, filters, sorts or rounds what the service sent.

FUNCTION SIGNATURE
ask_manual_question(question_text, conversation_history)
PARAMETERS
question_text — Text. The question the person typed, supplied by the manual chat page.
conversation_history — List of dictionaries. The recent exchanges of this conversation, each holding a question and an answer,
cut by the page to at most config.CHAT_HISTORY_TURN_LIMIT entries before it gets here.
PURPOSE
Put one question to the manual assistant and bring back what it answered.
REQUIREMENTS
    ● The question and the conversation travel to the service as question and history, spelt exactly that way, because anything
      else is refused before the manuals are searched.
    ● This is the only call in the dashboard that costs a language model call, and it costs exactly one however the question turns
      out, so the call is made once per question and never repeated to fill in a missing part of the reply.
    ● The whole exchange must fit inside config.API_REQUEST_TIMEOUT_SECONDS, which is generous enough for a search
      and one model call, and no separate limit is written here.
    ● The record that comes back carries question_type, answer, source_documents and chunks_searched, and reaches the
      caller exactly as the service sent it. Nothing is re-judged, re-worded or re-counted on the way through.
    ● An unsuccessful reply reaches the caller as a failure rather than as an empty result or an invented answer, because a
      technician must never be shown a blank where an instruction should be.
RETURNS
One record holding what the assistant answered, the kind of question it was, the documents it came from and how many
passages were searched.

FUNCTION SIGNATURE
fetch_recent_chat_turns(turn_limit)
PARAMETERS
turn_limit — Number. How many of the most recent recorded questions are wanted, supplied by the audit page from
config.CHAT_AUDIT_RECENT_ROWS.
PURPOSE
Obtain the questions the manual assistant was asked most recently, for the audit trail.


REQUIREMENTS
    ● The number wanted travels to the service as a named query value called turn_limit, spelt exactly that way.
    ● The order the service supplied, the most recent question at the top, survives untouched, and no entry is dropped, merged
      or re-sorted here.
    ● Each record carries at least username, question, question_type, answer, source_documents, machine_code,
      latency_milliseconds and asked_at.
    ● An unsuccessful reply reaches the caller as a failure, a refusal of the audit area included, rather than being quietly shown
      as an empty log.
RETURNS
A list of recorded questions, in the order the service supplied them.



MODULE: dashboard/manual_chat.py
Draws the page named exactly config.PAGE_CHAT: the one page a Technician is allowed to open, where a person standing at a
machine asks the manuals a question. The conversation is kept for one browser tab and nowhere else, is sent to the service with
every question, and is never written to disk, so signing out or closing the tab ends it. Every answer is shown with the documents it
came from, and an answer with no documents under it is either a refusal or a fact read from the fleet data, with the marking
above it saying which.
A single lookup named CHAT_TYPE_BADGE_COLOURS exists at module level under exactly that name and gives each of the
kinds in config.CHAT_TYPE_OPTIONS its own colour, config.CHAT_TYPE_OUT_OF_SCOPE among them being given a plainly
neutral one so that a refusal is never dressed up as an answer. The page settles nothing itself: it does not decide what kind a
question is, does not search anything, and never rewrites an answer.

FUNCTION SIGNATURE
render_one_exchange(past_turn)
PARAMETERS
past_turn — Dictionary. One exchange of the conversation, holding the "question" that was asked, the "answer" that came back,
and where the service supplied them the "question_type", the "source_documents" and the "chunks_searched".
PURPOSE
Draw one question and its answer, marked with the kind of question it was and the documents the answer came from.
REQUIREMENTS
    ● The question is presented as the person's own and the answer as the assistant's, distinguished so that who said what is
      never in doubt when several exchanges are read one after another.
    ● The kind of question is marked immediately above the answer, in the colour found by looking that kind up in
      CHAT_TYPE_BADGE_COLOURS, and a kind that is not in the lookup falls back to a neutral colour rather than going
      unmarked, so a refusal can be seen without reading it.
    ● An exchange carrying no kind at all is treated as config.CHAT_TYPE_PROCEDURE.
    ● A supporting line beneath the answer states how many passages were searched, taken from "chunks_searched" and
      counted as none where the exchange does not carry it.
    ● Where the exchange names documents, that same line goes on to name them, each separated from the next, so the
      reader can trace the answer back. Where it names none, the line carries the passage count alone and nothing is invented
      to fill the gap.
    ● The question and the answer appear exactly as they are, with nothing summarised, shortened, reworded or re-cased.
RETURNS
Nothing; it draws part of the page.

FUNCTION SIGNATURE
render_manual_chat_page(ask_handler)
PARAMETERS
ask_handler — The function that puts one question to the service and returns what it answered. It is passed in rather than
imported so that this page can be exercised on its own; in the running dashboard render_chat_page supplies
ask_manual_question.
PURPOSE
Draw the conversation so far and take the next question.
REQUIREMENTS
    ● A heading names the page, and a line beneath states that answers come only from the Meridian manuals, safety rules and
      policies, and says how many recent exchanges are remembered, that number read from
      config.CHAT_HISTORY_TURN_LIMIT rather than written into the page.
    ● The conversation is held for the one browser tab under a single agreed name, created empty the first time the page is
      opened, and every exchange already in it is drawn in the order it happened, by render_one_exchange, before anything new
      is asked for.
    ● One place to type a question invites a procedure, a permit, a part or a machine. Until a question is actually submitted
      nothing is sent, nothing is added to the conversation, and the page simply stops there.
    ● Only the question and the answer of each earlier exchange travel with a new question. The kind, the documents and the
      passage count are for the screen and the service neither needs nor wants them back.
    ● At most config.CHAT_HISTORY_TURN_LIMIT of the most recent exchanges are sent, so the page never relies on the
      service to cut a conversation it should not have sent whole.


    ● While the service is working the person is told that the manuals are being searched and that this makes one language
      model call, so the wait is explained and its cost is not hidden.
    ● When the reply arrives the new exchange is added to the end of the conversation holding the question as typed together
      with the answer, the kind, the documents and the passage count the service returned, and the page is drawn again so that
      the new exchange appears alongside the rest.
    ● The conversation is never written anywhere but the tab: closing it or signing out ends it, and two people chatting at the
      same time never see each other's questions.
RETURNS
Nothing; it draws the page.



MODULE: dashboard/audit_trail.py — the chat log
The audit trail already carries the register of reviewed repair jobs, the decision record and the call budget. The manual assistant
belongs there too. A technician acts on what the assistant tells them, so those answers sit in the permanent record next to the
repair jobs, and the kind of question shows at a glance which answers came from a document, which came from the machine
data and which were refused.
FUNCTION SIGNATURE
render_chat_log(chat_turns)
PARAMETERS
chat_turns — List of dictionaries. The recorded questions from fetch_recent_chat_turns, newest first, supplied by
render_audit_page which asks for config.CHAT_AUDIT_RECENT_ROWS of them.
PURPOSE
Draw what the manual assistant has been telling people, as part of the permanent record.
REQUIREMENTS
    ● A heading names this the manual assistant log, and where nothing has been asked yet a single notice says exactly that
      and nothing further is drawn.
    ● Where there is something to show, a line states how many recent questions are being shown and that the newest is first.
    ● One entry per recorded question, in the order supplied, each closed until the reader opens it, so a long log stays readable.
    ● The heading of an entry carries when it was asked, then who asked it from username, then the opening of the question, the
      three parts separated so they do not run together.
    ● The time is shortened from the stored precision to the date and the minute, and is made readable rather than left in the
      machine form the service sent it in.
    ● The question in the heading is cut to its first seventy characters, so that one long question cannot push every other
      heading out of line; the whole question is never needed there because the answer beneath carries the context.
    ● Opened, an entry marks the question_type, writes out the answer exactly as recorded, and closes with a line naming
      source_documents where any were recorded.
    ● Where no documents were recorded no such line appears at all, so an answer read from the machine data and a refusal
      are never made to look sourced.
    ● source_documents arrives here as one piece of text, as the log stored it, and is shown as it stands rather than taken apart.
    ● Nothing is re-judged, re-scored, re-worded or re-ordered. This page reports the record; it does not revisit it.
RETURNS
Nothing; it draws part of the page.



MODULE: run_dashboard.py — the chat page
The dashboard carries five pages, not four, and the fifth is the manual chat. Its name is held at module level as PAGE_CHAT,
taking its text from config.PAGE_CHAT because the service uses the same name to work out what each role is allowed and the
two must never drift apart, and it carries one short line in PAGE_DESCRIPTIONS like every other page so the sidebar reads as a
workflow rather than a list of unrelated screens. It is the only page a Technician sees. Hiding a page from a role only tidies the
sidebar; the service refuses the matching area on its own account, so a hidden page cannot be reached by calling the service
directly.

FUNCTION SIGNATURE
render_chat_page()
PARAMETERS
None.
PURPOSE
Draw the manual chat, handing it the function that talks to the service.
REQUIREMENTS
    ● Drawing is handed straight to render_manual_chat_page, with ask_manual_question passed in as the function that puts a
      question to the service, so the page module holds no service address of its own and can still be exercised on its own.
    ● Nothing is fetched, counted, filtered, scored or reshaped here, and no conversation is held here; this function exists only to
      join the page to the service.
    ● It is reached only when somebody is signed in and has chosen this page from the sidebar, and the page is offered in that
      sidebar only to a role config allows it to.
    ● A service that cannot be reached is handled where every other page's failure is handled, so the person sees the panel
      telling them how to start the service rather than a failure trace.
RETURNS


Nothing; it draws the page.

============= DASHBOARD AND ENTRY POINTS ============


========== GROUP: DASHBOARD MODULES =========


MODULE: dashboard/api_client.py
PURPOSE
The single point of contact between the dashboard and the AssetGuard AI service. Every number, every repair job and every
decision record shown anywhere in the dashboard is obtained through one of the functions in this module.
REQUIREMENTS
    ● Every call is addressed to the service at config.API_BASE_URL and bounded by
      config.API_REQUEST_TIMEOUT_SECONDS, with no other address and no other limit written anywhere in the dashboard.
    ● The dashboard holds no model, no scoring rule and no database connection of its own, so one copy of the models is
      loaded rather than two and a risk score is worked out in exactly one place.
    ● A refused connection, an exhausted timeout or an error reply reaches the caller as a failure rather than an empty result or
      an invented value, which is what render_service_warning depends on; the one deliberate exception is the unknown
      machine described under fetch_machine_detail.
    ● Nothing in this module reshapes, filters, sorts or rounds what the service sent.

FUNCTION SIGNATURE
fetch_fleet_risk_table(risk_band)
PARAMETERS
    ● risk_band — which slice of the scored fleet is wanted. Either config.RISK_BAND_ALL for the whole fleet, or one of
      config.RISK_BAND_HIGH, config.RISK_BAND_MEDIUM, config.RISK_BAND_LOW. Supplied by render_fleet_page (which
      asks for ALL) and by render_machine_page (which asks for config.RISK_BAND_HIGH).
PURPOSE
Obtain every machine the service scored, restricted to one risk band or covering the whole fleet.
REQUIREMENTS
    ● The band travels to the service as a named query value called risk_band, spelt exactly that way, because the service
      rejects anything else.
    ● The order the service supplied, the most at-risk machine at the top, survives untouched.
    ● Each record carries at least machine_code, machine_type, factory_name, importance, breakdown_probability, risk_band,
      priority, average_vibration, average_temperature_c and alarms_this_week.
    ● An unsuccessful reply reaches the caller as a failure.
RETURNS
A list of records, one per scored machine, in the order the service supplied them.

FUNCTION SIGNATURE
fetch_machine_detail(machine_code)
PARAMETERS
    ● machine_code — the identifier of one machine, chosen by the person on the Machine detail page and supplied by
      render_machine_page from the high risk list that fetch_fleet_risk_table returned.
PURPOSE
Assemble everything the dashboard knows about one machine: its identity and condition, its current risk score, and what its past
technician notes point to.
REQUIREMENTS
    ● The machine profile, the risk assessment and the note history sit under the keys profile, risk and notes, spelt exactly that
      way, because dashboard/machine_detail.py reads them by those names.
    ● A machine the service does not recognise yields an empty result rather than a failure, so that render_machine_page can
      say plainly that the tag is not in the current fleet; every other unsuccessful reply reaches the caller as a failure.
    ● The risk score and the problem type verdict are the ones the service calculated and are never recalculated locally.
    ● Each of the three calls is bounded by config.API_REQUEST_TIMEOUT_SECONDS.
RETURNS
One record holding the profile, risk and notes parts for the machine, or an empty record when the machine is unknown.

FUNCTION SIGNATURE
request_advisory_run(advisory_request)
PARAMETERS
    ● advisory_request — the instruction to the agents, assembled by render_machine_page. It carries machine_code,
      request_text and access_level, under exactly those names.
PURPOSE
Ask the service to run the agent workflow against one machine and produce a drafted repair job that waits for a human decision.
REQUIREMENTS
    ● The instruction travels as the body of a creation call to the advisory endpoint of the service, not as query values.
    ● access_level is one of config.ACCESS_LEVEL_OPTIONS, since the service refuses anything else before any agent runs.
    ● The full config.API_REQUEST_TIMEOUT_SECONDS is allowed and the call is not shortened, because five language model
      calls run inside the service before a reply arrives.


     ● The reply is the repair job exactly as the service stored it, including repair_job_id and run_id, and an unsuccessful reply
       reaches the caller as a failure rather than a pretended draft.
RETURNS
The drafted repair job record as stored by the service.

FUNCTION SIGNATURE
fetch_repair_job_detail(repair_job_id)
PARAMETERS
     ● repair_job_id — the identifier of one repair job, supplied by render_audit_page from the chooser of decided orders.
PURPOSE
Obtain one repair job in full, including the fields the register table leaves out.
REQUIREMENTS
     ● The identifier forms part of the address of the repair job on the service, not a query value.
     ● The full record carries run_id, which render_audit_page needs to ask for the call budget, and changes_applied and status,
       which render_decision_detail reads.
     ● The call is bounded by config.API_REQUEST_TIMEOUT_SECONDS and an unsuccessful reply reaches the caller as a
       failure.
RETURNS
One complete repair job record.

FUNCTION SIGNATURE
fetch_repair_jobs(status_value)
PARAMETERS
     ● status_value — which register is wanted: config.REPAIR_JOB_STATUS_PENDING,
       config.REPAIR_JOB_STATUS_APPROVED or config.REPAIR_JOB_STATUS_REJECTED. Supplied by render_review_page
       for the pending queue and by render_audit_page for the two decided registers.
PURPOSE
Obtain every repair job currently sitting in one status.
REQUIREMENTS
     ● The status travels to the service as a named query value called status_value, spelt exactly that way, because the service
       rejects anything else.
     ● Only the three values in config.REPAIR_JOB_STATUS_OPTIONS are meaningful; the dashboard invents no fourth.
     ● The order the service supplies, newest at the top, is preserved.
     ● The call is bounded by config.API_REQUEST_TIMEOUT_SECONDS and an unsuccessful reply reaches the caller as a
       failure.
RETURNS
A list of repair job records in the requested status, possibly empty.

FUNCTION SIGNATURE
submit_supervisor_decision(repair_job_id, decision_payload)
PARAMETERS
     ● repair_job_id — the identifier of the drafted order being decided, taken from the pending record that fetch_repair_jobs
       returned.
     ● decision_payload — the supervisor's answer, assembled by render_decision_form. It carries decision, reviewer_name and
       feedback_text, under exactly those names.
PURPOSE
Record a supervisor's decision against a drafted repair job and let the paused advisory run finish.
REQUIREMENTS
     ● This is the only route by which a decision is recorded and the only thing that releases a paused run, so nothing is issued
       unless a person has approved, modified or rejected the draft through it.
     ● decision is one of config.REVIEW_DECISION_OPTIONS, since the service refuses anything else.
     ● The full config.API_REQUEST_TIMEOUT_SECONDS is allowed, because an approval or a modification causes a further
       language model call inside the service.
     ● The reply is the repair job as it stands with the decision applied, and an unsuccessful reply reaches the caller as a failure,
       so a decision that did not land is never reported as though it had.
RETURNS
The repair job record as it stands after the decision.

FUNCTION SIGNATURE
fetch_review_history(repair_job_id)
PARAMETERS
     ● repair_job_id — the identifier of one repair job, supplied by render_audit_page for the order the person opened.
PURPOSE
Obtain the permanent record of every decision taken against one repair job.
REQUIREMENTS
     ● Each record carries decision, reviewer_name, feedback_text, reviewed_draft and decided_at, which is what
       render_decision_detail needs.
     ● The history is complete; the dashboard never trims it to the latest entry.


    ● The call is bounded by config.API_REQUEST_TIMEOUT_SECONDS and an unsuccessful reply reaches the caller as a
      failure.
RETURNS
A list of recorded decisions for the repair job, possibly empty.

FUNCTION SIGNATURE
fetch_call_budget(run_id)
PARAMETERS
    ● run_id — the identifier of the advisory run behind a repair job, taken from the run_id field of the record that
      fetch_repair_job_detail returned and supplied by render_audit_page. It is not the repair job identifier.
PURPOSE
Obtain what one advisory run cost in language model calls.
REQUIREMENTS
    ● The record carries call_count, expected_call_count, total_latency_milliseconds and the list of individual calls.
    ● expected_call_count is the figure the service decided and is never replaced by config.EXPECTED_LLM_CALLS_PER_RUN,
      because a rejected repair job legitimately costs one call fewer.
    ● The call is bounded by config.API_REQUEST_TIMEOUT_SECONDS and an unsuccessful reply reaches the caller as a
      failure.
RETURNS
One record describing the run's language model usage, including the list of individual calls.



MODULE: dashboard/fleet_overview.py
PURPOSE
Draws the page named exactly Fleet overview: which machines across the fleet are closest to failing, and how many sit in each
risk band.
REQUIREMENTS
    ● FLEET_TABLE_COLUMNS exists at module level under exactly that name and lists, in this order, machine_code,
      machine_type, factory_name, importance, risk_band, priority and breakdown_probability.
    ● FLEET_COLUMN_LABELS exists at module level under exactly that name and gives each of those columns a short
      readable heading for display.
    ● The sensor readings the service also supplies are absent from the register on this page, because they belong on the
      Machine detail page and repeating them across several hundred rows makes the table unreadable without helping anyone.
    ● Every figure on this page is one the service already worked out; nothing is calculated from raw data here.

FUNCTION SIGNATURE
count_machines_by_band(fleet_rows)
PARAMETERS
    ● fleet_rows — the scored fleet as returned by fetch_fleet_risk_table, reaching this module through render_fleet_page and
      render_fleet_overview_page.
PURPOSE
Count how many machines sit in each of the three risk bands, for the headline figures at the top of the page.
REQUIREMENTS
    ● All three of config.RISK_BAND_HIGH, config.RISK_BAND_MEDIUM and config.RISK_BAND_LOW appear as keys even
      when no machine falls in that band, so an empty band reads as zero rather than being missing.
    ● The count comes from the risk_band field the service already assigned and is never recomputed from
      breakdown_probability against the thresholds.
    ● An empty input yields all three counts at zero rather than a failure.
RETURNS
A record keyed by the three band names, each holding a whole-number count.

FUNCTION SIGNATURE
build_fleet_table(fleet_rows, chosen_band)
PARAMETERS
    ● fleet_rows — the scored fleet as returned by fetch_fleet_risk_table.
    ● chosen_band — the band the planner picked from the chooser on the page, supplied by render_fleet_overview_page. Either
      the literal ALL or one of config.RISK_BAND_HIGH, config.RISK_BAND_MEDIUM, config.RISK_BAND_LOW.
PURPOSE
Turn the scored fleet into the narrow register the planner reads, keeping only the band that was asked for.
REQUIREMENTS
    ● Only the fields named in FLEET_TABLE_COLUMNS survive, in the order that list gives them.
    ● The literal ALL keeps every machine, and any band value keeps only machines whose risk_band matches it exactly.
    ● The most-at-risk-at-the-top order the service supplied survives the selection unchanged, with no re-ordering here.
    ● A band with no machines yields an empty table rather than a failure.
RETURNS
A table of the selected machines restricted to the display fields.

FUNCTION SIGNATURE


render_fleet_overview_page(fleet_rows)
PARAMETERS
    ● fleet_rows — the scored fleet as returned by fetch_fleet_risk_table for the literal ALL, supplied by render_fleet_page.
PURPOSE
Draw the Fleet overview page: the headline counts and the register of machines closest to failure.
REQUIREMENTS
    ● A heading naming the page and an explanatory line stating what the figures are and where the band boundaries come
      from, naming config.HIGH_RISK_THRESHOLD, config.MEDIUM_RISK_THRESHOLD and policy Policy 01, are present.
    ● Where nothing came back, a single calm notice that no machines were returned and that the service may not be running is
      all that appears.
    ● Four headline figures sit together across the top — how many machines are monitored in total and the count for each band
      from count_machines_by_band, the high and medium figures carrying a short explanation of what a planner is expected to
      do — above a band chooser laid out on one line rather than stacked, offering exactly the literal ALL,
      config.RISK_BAND_HIGH, config.RISK_BAND_MEDIUM and config.RISK_BAND_LOW.
    ● The register comes from build_fleet_table for the chosen band with the readable headings in FLEET_COLUMN_LABELS, no
      row numbers, sortable by the planner, breakdown_probability as a proportion between zero and one shown to three
      decimal places, and a closing line stating how many machines are shown and pointing the planner to the Machine detail
      page.
RETURNS
Nothing; it draws the page.



MODULE: dashboard/machine_detail.py
PURPOSE
Draws the page named exactly Machine detail: everything known about one machine, on one screen.
REQUIREMENTS
    ● The module displays the combined record produced by fetch_machine_detail and contacts the service itself for nothing.
    ● Every figure shown, including the risk band and the problem type verdict, is one the service already worked out, never
      derived or recalculated here.

FUNCTION SIGNATURE
render_machine_condition(machine_detail)
PARAMETERS
    ● machine_detail — the combined record from fetch_machine_detail, holding the profile, risk and notes parts.
PURPOSE
Show one machine's identity, its risk assessment and this week's condition readings.
REQUIREMENTS
    ● A heading joining machine_code and machine_type makes the machine identifiable at a glance, with a supporting line
      giving factory_name, production_line, usage_pattern and machine_age_months expressed in whole months.
    ● Three coloured markers sit on a single line, kept tight together rather than spread across the width of the page: the risk
      band coloured by looking the band up in config.RISK_BAND_BADGE_COLOURS, the priority, and the importance.
    ● A bordered risk panel holds three figures side by side: breakdown_probability explained as the chance of a breakdown
      within thirty days as judged by the breakdown risk model, risk_band, and priority explained as the band crossed with
      machine importance under policy Policy 01.
    ● A second bordered panel for the week's condition holds three figures side by side: average_vibration with its unit,
      average_temperature_c with its unit, and alarms_this_week as a whole number.
RETURNS
Nothing; it draws part of the page.

FUNCTION SIGNATURE
build_vote_table(problem_votes)
PARAMETERS
    ● problem_votes — the tally of how many past notes point at each problem type, taken from the notes part of the record
      returned by fetch_machine_detail.
PURPOSE
Turn the problem type tally into a small table showing which mode the note history most supports.
REQUIREMENTS
    ● One row per problem type present in the tally, under the headings problem type and notes, spelt exactly that way, because
      render_note_history relabels them by those names.
    ● The mode with the most notes behind it sits at the top and the rest descend from there.
RETURNS
A table of problem types against the number of past notes supporting each, most supported at the top.

FUNCTION SIGNATURE
render_note_history(note_history)
PARAMETERS
    ● note_history — the notes part of the record returned by fetch_machine_detail, holding note_count, detected_problem_type,
      confidence, problem_votes and recent_notes.


PURPOSE
Show what the technician notes written about this machine in the past point to.
REQUIREMENTS
    ● The whole thing sits in one bordered panel with a heading that says these are the technician notes talking.
    ● A machine whose note_count is zero shows a single plain statement to that effect and nothing further, with no empty table
      and no zero-confidence verdict.
    ● Where notes exist, detected_problem_type is the headline finding, supported by a line stating the confidence, how many
      past notes were read, and that the note-reading model considered every note written for this machine.
    ● The recent_notes sit in a panel that opens on request rather than being printed down the page, and the tally from
      build_vote_table sits beside the verdict taking less width than it, its two headings relabelled to read as Problem type and
      Notes, with no row numbers.
RETURNS
Nothing; it draws part of the page.

FUNCTION SIGNATURE
render_machine_detail_page(machine_detail)
PARAMETERS
    ● machine_detail — the combined record from fetch_machine_detail, supplied by render_machine_page.
PURPOSE
Draw the whole Machine detail view for the machine chosen in the sidebar.
REQUIREMENTS
    ● The condition view from render_machine_condition and the note history from render_note_history both appear, drawn
      from the same single record so the two halves cannot disagree about which machine is on screen.
    ● The notes part of the record is what reaches render_note_history.
    ● The function asks the service for nothing and adds no figures of its own; it composes what is already there.
RETURNS
Nothing; it draws the page.



MODULE: dashboard/review_queue.py
PURPOSE
Draws the page named exactly Review queue: the place where the maintenance supervisor approves, modifies or rejects a
drafted repair job.
REQUIREMENTS
    ● This page is the human in the loop: until a decision is submitted here the advisory run stays paused on disk, no further
      language model call is made, and nothing is issued against the machine.
    ● The only three answers a supervisor may record are those in config.REVIEW_DECISION_OPTIONS; the page offers no
      fourth option and no way to skip the question.
    ● The page decides nothing and edits nothing; it presents what the agents drafted and carries the person's answer to the
      service unchanged.

FUNCTION SIGNATURE
render_repair_job_summary(repair_job)
PARAMETERS
    ● repair_job — one drafted repair job awaiting review, from the list that fetch_repair_jobs returned for
      config.REPAIR_JOB_STATUS_PENDING.
PURPOSE
Present one drafted repair job in the form a supervisor needs in order to decide on it.
REQUIREMENTS
    ● Three coloured markers sit on a single line — the risk_band coloured by looking the band up in
      config.RISK_BAND_BADGE_COLOURS, the priority and the problem_type — above a supporting line naming machine_code
      and machine_type with job_summary written out in full.
    ● Two bordered panels sit side by side: a job card stating procedure_reference, parts_required, estimated_downtime_hours
      with its unit and proposed_window, each clearly labelled with scheduling_note beneath as supporting text; and a task
      panel holding the steps and closing with a line naming source_documents.
    ● task_steps arrives as a single stored piece of text with the individual steps separated by line breaks and appears as a
      numbered list whose numbering is generated for display rather than assumed to be present in the stored text.
    ● permit_required and safety_notes appear together in a prominent warning that cannot be mistaken for ordinary supporting
      text, so a supervisor cannot approve the job without having seen it.
RETURNS
Nothing; it draws part of the page.

FUNCTION SIGNATURE
render_decision_form(repair_job, decision_handler)
PARAMETERS
    ● repair_job — the drafted repair job being decided, the same record that render_repair_job_summary was given.
    ● decision_handler — the function that records the decision with the service. It is passed in rather than imported so that this
      page can be exercised on its own; in the running dashboard render_review_page supplies submit_supervisor_decision.


PURPOSE
Collect the supervisor's decision on one drafted repair job and hand it to the service.
REQUIREMENTS
    ● The inputs are grouped so that nothing at all reaches decision_handler until the person deliberately submits, and each
      waiting draft has its own set of inputs distinguished by its repair_job_id so that several drafts on the page cannot interfere
      with one another.
    ● The decision choice offers exactly config.REVIEW_DECISION_OPTIONS on one line alongside the person's name and a
      free-text instruction to the finalizer carrying a prompt that shows the kind of thing worth writing there, with a note stating
      that approving or modifying costs one further language model call because the finalizer rewrites the repair job while
      rejecting costs none.
    ● A name of fewer than two characters with surrounding blanks removed is refused with a clear message and
      decision_handler is never reached, and where nothing was submitted the page is left exactly as it was.
    ● decision_handler receives the repair_job_id and a record carrying decision, reviewer_name and feedback_text under
      exactly those names, the person sees that work is under way while the service is waited on, and the page is redrawn so the
      decided order leaves the queue instead of sitting there inviting a second decision.
RETURNS
Nothing; it draws the form and acts on the submission.

FUNCTION SIGNATURE
render_review_queue_page(pending_repair_jobs, decision_handler)
PARAMETERS
    ● pending_repair_jobs — the drafts awaiting a decision, from fetch_repair_jobs called with
      config.REPAIR_JOB_STATUS_PENDING, supplied by render_review_page.
    ● decision_handler — the function that records a decision, passed straight through to render_decision_form;
      render_review_page supplies submit_supervisor_decision.
PURPOSE
Draw the queue of drafted repair jobs that are waiting for a supervisor's decision.
REQUIREMENTS
    ● A heading naming the page is present, and an empty queue is a normal state rather than an error: the page says nothing is
      waiting, tells the person that an advisory run raised from the Machine detail page will put a draft here, and draws nothing
      further.
    ● Where drafts are waiting, a line states how many are drafted and unactioned and cites policy Safety Rule 02, under which
      no machine leaves service without an approved shutdown authorisation.
    ● Each waiting draft occupies its own collapsible entry labelled with its repair_job_id, its machine_code and its priority so
      the queue can be scanned without opening anything, sitting open where exactly one draft is waiting and collapsed where
      there are more.
    ● Each entry holds the presentation from render_repair_job_summary together with the inputs from render_decision_form
      for that same draft, and nothing is issued for any repair job that has not been decided through this page.
RETURNS
Nothing; it draws the page.

MODULE: dashboard/audit_trail.py
PURPOSE
Draws the page named exactly Audit trail: the permanent record of what was decided, what the decision changed, and what the
run cost.
REQUIREMENTS
    ● AUDIT_TABLE_COLUMNS exists at module level under exactly that name and lists, in this order, repair_job_id,
      machine_code, problem_type, priority, estimated_downtime_hours, status and created_at.
    ● AUDIT_COLUMN_LABELS exists at module level under exactly that name and gives each of those columns a short
      readable heading for display.
    ● The register stays narrow enough to read because the full text of any repair job is one click away below it rather than
      carried in the table.
    ● For any reviewed repair job the page makes plain whether the review changed the repair job or not; that question is what
      the page exists to answer.

FUNCTION SIGNATURE
render_audit_trail_page(approved_jobs, rejected_jobs)
PARAMETERS
    ● approved_jobs — from fetch_repair_jobs called with config.REPAIR_JOB_STATUS_APPROVED, supplied by
      render_audit_page.
    ● rejected_jobs — from fetch_repair_jobs called with config.REPAIR_JOB_STATUS_REJECTED, supplied by
      render_audit_page.
PURPOSE
Draw the register of every repair job that has been through review, approved and rejected alike.
REQUIREMENTS
    ● A heading naming the page and a line stating the retention obligation, that every supervisor decision is kept for seven
      years under policy Safety Rule 02 and is open to internal and statutory audit, are present.


     ● The two lists are treated as one register with the approved entries ahead of the rejected ones and the same treatment
       applied to both, and where neither holds anything a single notice states that nothing has been reviewed yet and nothing
       further is drawn.
     ● Three headline figures sit together: how many orders have been reviewed in total, how many were approved, and how
       many were rejected.
     ● The register table is restricted to the fields named in AUDIT_TABLE_COLUMNS in that order, with the readable headings
       from AUDIT_COLUMN_LABELS, no row numbers, estimated_downtime_hours to one decimal place with its unit, and
       created_at shortened from its stored microsecond precision to the date and the minute.
RETURNS
Nothing; it draws the page.

FUNCTION SIGNATURE
render_repair_job_text(decided_job)
PARAMETERS
     ● decided_job — one repair job record; on the running page this is the full record returned by fetch_repair_job_detail for the
       order the person opened.
PURPOSE
Write out the readable body of one repair job: what the job is, the steps, and where the steps came from.
REQUIREMENTS
     ● job_summary appears as written.
     ● task_steps arrives as one stored piece of text with the steps separated by line breaks and appears as a numbered list
       whose numbering is generated for display rather than taken from the stored text.
     ● A closing line names source_documents so the reader can trace any step back to the procedure it came from, and the
       function makes no judgement about whether the order was approved or changed.
RETURNS
Nothing; it writes part of the page.

FUNCTION SIGNATURE
render_decision_detail(decided_job, decision_history)
PARAMETERS
     ● decided_job — the full repair job record from fetch_repair_job_detail for the order the person opened, supplied by
       render_audit_page.
     ● decision_history — every decision recorded against that same order, from fetch_review_history, supplied by
       render_audit_page.
PURPOSE
Answer one question about a reviewed repair job: did the review actually change the repair job, or not.
REQUIREMENTS
     ● The whole record sits in one bordered panel headed as the decision record, and every decision in decision_history
       contributes who decided, from reviewer_name with the decision marked in the colour found by looking it up in
       config.REVIEW_DECISION_BADGE_COLOURS and decided_at shortened to the date and the minute, and what they asked
       for, from feedback_text, with an explicit statement that nothing in particular was asked for where that text is blank or only
       blanks.
     ● The draft the supervisor was looking at is the reviewed_draft carried on the recorded decision, supplied by the last entry in
       decision_history where more than one exists, and never reconstructed from anything else.
     ● The outcome is read from the status of decided_job and never inferred from the change note, so an order at
       config.REPAIR_JOB_STATUS_REJECTED reads plainly as no repair job issued while an approved order the finalizer
       happened to leave alone never reads as a rejection.
     ● Exactly one panel opens on request and what it holds follows how many versions of the text genuinely exist: a rejected
       order offers the rejected draft exactly as the agents wrote it and nothing else; an approved order whose changes_applied
       is blank, or is the single word none in any combination of letter cases with surrounding blanks removed, carries a
       cautioning note that the finalizer made no changes and that an instruction has to say what to change before it can be
       acted on, its panel holding only the approved text by way of render_repair_job_text; and an approved order with real
       changes states those changes as the result in a positive note, its panel holding the draft the supervisor reviewed and the
       approved version one beneath the other, under headings that make clear which is which and separated so the reader can
       compare them.
RETURNS
Nothing; it draws part of the page.

FUNCTION SIGNATURE
build_call_table(call_records)
PARAMETERS
     ● call_records — the list of individual logged calls carried inside the record that fetch_call_budget returned.
PURPOSE
Turn the logged language model calls for one run into a readable table.
REQUIREMENTS
     ● One row per logged call, kept in the order the calls ran, with no re-ordering and no grouping, because the sequence is part
       of the evidence.


     ● The row fields are headed agent, prompt characters, reply characters and seconds, spelt exactly that way, because
       render_call_budget relabels them by those names.
     ● Those fields come from agent_name, prompt_characters and response_characters as recorded, and from
       latency_milliseconds converted from milliseconds into seconds and rounded to two decimal places.
RETURNS
A table of the run's logged calls, in the order they ran.

FUNCTION SIGNATURE
render_call_budget(call_budget)
PARAMETERS
     ● call_budget — the record from fetch_call_budget for the run_id carried on the repair job the person opened, supplied by
       render_audit_page.
PURPOSE
Show what one advisory run cost in language model calls.
REQUIREMENTS
     ● The whole thing sits in one bordered panel headed to say these are language model calls.
     ● Two figures sit side by side: the calls used, stated as call_count against expected_call_count, and the total model time
       from total_latency_milliseconds converted into seconds and shown to one decimal place.
     ● The expected figure is the expected_call_count the service supplied and never a fixed number written into the page, with
       the reason available to the reader beside it, that a rejected repair job skips the finalizer and is one call cheaper by design.
     ● The per-call detail comes from build_call_table with its four headings relabelled to read plainly, the seconds shown to two
       decimal places, and no row numbers.
RETURNS
Nothing; it draws part of the page.



========== GROUP: ENTRY POINTS ==========


MODULE: run_database_setup.py
PURPOSE
Entry point 1. Creates the store the running application writes to, the tables inside it, and the accounts people sign in with.
Nothing else in the project can be run until this has been: the service refuses every request from a caller it cannot recognise, so a
database with no accounts in it is a dashboard nobody can open.
REQUIREMENTS
     ● The file is run from the Project folder, because every path in config/config.py is written relative to it.
     ● It defines no functions of its own and arranges pieces the project already provides: create_database_directory,
       create_all_tables and the shared engine from persistence/database.py, insert_user_account from
       persistence/repository.py, and create_password_salt and create_password_hash from access/password_security.py.
     ● Running it again is safe: existing tables and everything in them are left intact, and an account that is already there keeps
       the hash and the sign in token it already had, so nobody is signed out by a second run.
MAIN BLOCK
Achieves:
    ● The folder that holds the store exists, prepared using config.DATABASE_DIRECTORY expressed as text.
    ● The store file itself exists and every table defined in persistence/models.py is present inside it, created against the shared
      engine defined in persistence/database.py so they land in the same store every other part of the project opens.
    ● Each of those tables carries columns beyond its key, and a second run of the file changes nothing.
    ● Every entry of config.SEED_USER_ACCOUNTS has an account in user_accounts afterwards, carrying the username,
      display name and role that entry names.
    ● An entry whose role is not one of config.ROLE_OPTIONS stops the run with an error naming both the account and the role,
      because an account with a role nothing recognises signs in successfully and then sees an empty dashboard with no
      explanation.
    ● No account row holds a password anybody could read: what is stored is a hash and the salt it was made with, each
      account salted separately, and the plain passwords in config.SEED_USER_ACCOUNTS are read here and nowhere else in
      the project.
Creates on disk:
    ● The directory named by config.DATABASE_DIRECTORY.
    ● The store file named by config.APPLICATION_DATABASE_FILE, holding the tables that record advisory runs, repair jobs,
      review decisions, logged language model calls, the accounts people sign in with and the questions put to the manual chat.
Reports to the person who ran it:
    ● That the directory is ready, and where it is.
    ● The path of the store file.
    ● The names of the tables now available, and how many tables that is, so the count can be checked against expectation at a
      glance.
    ● The accounts that can now be signed in with, each on its own line with the username, the role it carries and the password
      to use, because a person who has just built the database has no other way of finding out how to open the dashboard.

MODULE: run_data_preparation.py
PURPOSE


Entry point 2. Measures how dirty each raw dataset is, cleans all five of them, and writes the cleaned tables and the quality
report.
REQUIREMENTS
    ● The file is run from the Project folder, defines no functions of its own and arranges load_raw_dataset, build_quality_report,
      save_quality_report, clean_breakdown_dataset, clean_downtime_dataset and clean_technician_note_dataset.
    ● Every input path, output path, limit table and token list is taken from config/config.py by name, with no path and no
      threshold written into this file.
    ● Running it again is safe and reproduces the same outputs from the same inputs.
MAIN BLOCK
Achieves:
    ● The five raw datasets are measured in the state they arrive in, so the quality report describes the problems rather than the
      repairs.
    ● The raw files are read through load_raw_dataset with config.NULL_TOKEN_LIST applied, so the many spellings of an
      empty cell count as empty while being measured.
    ● Each dataset is profiled by build_quality_report under its own name — machine_breakdown_train,
      machine_breakdown_eval, repair_downtime_train, repair_downtime_eval and technician_notes — against the limit table
      that belongs to it, being config.BREAKDOWN_RANGE_LIMITS for the two risk files, config.DOWNTIME_RANGE_LIMITS for
      the two downtime files and config.TECHNICIAN_NOTE_RANGE_LIMITS for the notes.
    ● All five are cleaned into the processed folder by the dataset-specific function for each family, each reading its raw path
      from config/config.py and writing its cleaned path from config/config.py.
Creates on disk:
    ● The folders named by config.PROCESSED_DIRECTORY and config.OUTPUT_DIRECTORY, created where absent and left
      alone where present.
    ● The combined quality report at config.DATA_QUALITY_REPORT_FILE, covering all five raw datasets.
    ● The five cleaned tables at config.CLEAN_BREAKDOWN_TRAIN_FILE, config.CLEAN_BREAKDOWN_EVAL_FILE,
      config.CLEAN_DOWNTIME_TRAIN_FILE, config.CLEAN_DOWNTIME_EVAL_FILE and
      config.CLEAN_TECHNICIAN_NOTES_FILE.
Reports to the person who ran it:
    ● Where the quality report was written.
    ● For each of the five cleaned datasets, which dataset it is and how many rows and fields it now holds, so row counts can be
      checked against expectation.
    ● The share of the cleaned training rows that ended in a breakdown, taken from config.BREAKDOWN_TARGET_COLUMN
      and rounded to four decimal places, which is the sanity check that the target survived cleaning intact.

MODULE: run_model_training.py
PURPOSE
Entry point 3. Trains the two tabular models and the note-text model, scores each of them, saves the winners and writes the
combined scores.
REQUIREMENTS
    ● The file is run from the Project folder, defines no functions of its own and arranges load_processed_dataset,
      select_model_features, split_features_and_target, train_breakdown_model, train_downtime_model,
      train_problem_type_model, evaluate_classification_model, evaluate_regression_model, evaluate_text_classifier and
      save_evaluation_report.
    ● It reads only the cleaned tables in the processed folder, so everything entry point 2 produces must already be present.
    ● Every path is taken from config/config.py by name.
    ● Model settings such as the number of trees are absent from config/config.py and are the an implementation choice, made
      inside the modeling modules rather than here.
MAIN BLOCK
Achieves:
    ● The breakdown risk classifier is trained from config.CLEAN_BREAKDOWN_TRAIN_FILE and scored on the untouched hold-
      out file config.CLEAN_BREAKDOWN_EVAL_FILE; the downtime estimator is trained from
      config.CLEAN_DOWNTIME_TRAIN_FILE and scored on config.CLEAN_DOWNTIME_EVAL_FILE; the problem type classifier
      is trained from config.CLEAN_TECHNICIAN_NOTES_FILE.
    ● Neither tabular model is scored on data that carries its own answer: the identifier fields named in
      config.BREAKDOWN_IDENTIFIER_COLUMNS and config.DOWNTIME_IDENTIFIER_COLUMNS are removed by
      select_model_features, and the answer column is separated out by split_features_and_target using
      config.BREAKDOWN_TARGET_COLUMN and config.DOWNTIME_TARGET_COLUMN.
    ● The note model is scored using the very vectorizer its training returned, over config.NOTE_TEXT_COLUMN against
      config.NOTE_TARGET_COLUMN.
    ● There is no separate hold-out note file, so those note scores are training-set scores and are reported as such rather than
      passed off as hold-out performance.
Creates on disk:
    ● The folders named by config.MODEL_DIRECTORY and config.OUTPUT_DIRECTORY, created where absent.
    ● The saved winners at config.BREAKDOWN_MODEL_FILE, config.DOWNTIME_MODEL_FILE and
      config.PROBLEM_TYPE_MODEL_FILE, together with the fitted text vectorizer at config.TEXT_VECTORIZER_FILE.
    ● The combined scores at config.MODEL_METRICS_FILE, written by save_evaluation_report and holding one entry each
      under the keys breakdown_model, downtime_model and problem_type_model.
Reports to the person who ran it:


    ● Which model is being trained at any moment, numbered within its family and identified as tabular or text, so a run that
      takes minutes is followable.
    ● For each model, the scores it achieved and whether they are hold-out or training-set scores.
    ● Where each artefact was saved, the vectorizer included, and the path of the metrics file.

MODULE: run_knowledge_indexing.py
PURPOSE
Entry point 4. Builds the searchable maintenance knowledge store from the supplied procedure documents, and proves that the
store answers real questions.
REQUIREMENTS
    ● The file is run from the Project folder, defines no functions of its own and arranges build_knowledge_index,
      load_embedding_model, open_vector_collection, create_embedding_vectors, retrieve_relevant_chunks and
      format_retrieved_context.
    ● Running it again is safe because the stored collection is rebuilt from scratch rather than added to, so documents are never
      indexed twice and the stored count matches what splitting the documents again produces.
    ● The model that turns a question into numbers is the same one used to index the documents, otherwise the distances are
      meaningless.
MAIN BLOCK
Achieves:
    ● The documents in config.DOCS_DIRECTORY are read, cut into overlapping pieces and stored as searchable numbers at
      config.VECTOR_STORE_DIRECTORY.
    ● The store is exercised so the person can see for themselves that it works, using the embedding model named by
      config.EMBEDDING_MODEL_NAME on config.EMBEDDING_DEVICE against the collection named
      config.VECTOR_COLLECTION_NAME, each of three sample questions turned into numbers and matched to
      config.RETRIEVAL_RESULT_COUNT results joined into one passage by format_retrieved_context.
    ● The three questions are asked as written: one on the torque setting for a water pump bearing replacement, one on who
      approves a twelve hour shutdown of a critical machine, and one on why couplings keep failing after alignment.
    ● The third question is the real demonstration. It is asked the way a person on the floor would ask it rather than the way the
      casebook is headed, and the passage that answers it turns on a cause the question never names, so a store matching only
      shared words would not find it.
Creates on disk:
    ● The folder named by config.DATABASE_DIRECTORY, where absent.
    ● The store at config.VECTOR_STORE_DIRECTORY holding the collection named config.VECTOR_COLLECTION_NAME,
      rebuilt fresh on every run.
Reports to the person who ran it:
    ● That the index is being built, how many pieces ended up stored, and where the store lives.
    ● For each sample question, the question itself and the document name and distance of every match returned.
    ● The size in characters of the joined passage those matches produce, so an empty or absurdly short passage is visible
      immediately.

MODULE: run_api_service.py
PURPOSE
Entry point 5. Starts the AssetGuard AI service, which is the only thing in the project that loads the models and the only thing the
dashboard talks to.
REQUIREMENTS
    ● The file is run from the Project folder with plain python3, defines no functions of its own and arranges
      create_api_application from api/routes.py.
    ● The service opens the trained models, the current fleet and the knowledge store as it starts, so everything entry points 1 to
      4 produce must already be present, which is why starting is not instant.
    ● The listening address and port are taken from config.API_HOST and config.API_PORT and are never written as literal
      values in this file.
MAIN BLOCK
Achieves:
    ● A running service that answers the machine lookups, the fleet risk table, the advisory workflow and the review endpoints,
      built by create_api_application from config.API_TITLE and served on config.API_HOST at config.API_PORT.
    ● A service that stays up until the person stops it, which everything downstream, the dashboard included, depends on.
Creates on disk:
    ● Nothing of its own; it opens what entry points 1 to 4 produced.
    ● The work it serves writes into the store created by entry point 1 and the paused-run store named by
      config.CHECKPOINT_DATABASE_FILE.
Reports to the person who ran it:
    ● That the service is starting, under the title held in config.API_TITLE.
    ● The local web address of the interactive documentation page, built from config.API_PORT rather than from a typed-in
      number, so the service can be checked directly without the dashboard.

MODULE: run_dashboard.py
PURPOSE
Entry point 6. The AssetGuard AI dashboard: four pages that carry a planner from the fleet-wide picture, through one machine, to
a supervisor's decision and the permanent record of it.


REQUIREMENTS
    ● This file is not run with plain python3; it is the application file that the dashboard tool runs, invoked from the Project folder
      so that the settings file beside it is found.
    ● The port the dashboard listens on, the address it binds and its whole appearance come from .streamlit/config.toml rather
      than from config/config.py, so no port number and no styling instruction may appear in this file, and invoking it from
      anywhere other than the Project folder means that settings file is never found and the dashboard comes up on the wrong
      port.
    ● Exactly four pages exist, named by the module-level values PAGE_FLEET, PAGE_MACHINE, PAGE_REVIEW and
      PAGE_AUDIT, whose text is exactly Fleet overview, Machine detail, Review queue and Audit trail, with a module-level list
      named PAGE_DESCRIPTIONS holding one short line for each of the four in the same order.
    ● The dashboard holds no model, no scoring rule and no database connection of its own, so every figure on every page is
      asked for from the service at config.API_BASE_URL through dashboard/api_client.py, and where that service cannot be
      reached the person is told which command starts it rather than being shown a failure.

FUNCTION SIGNATURE
render_service_warning(connection_error)
PARAMETERS
    ● connection_error — the failure raised when a call made through dashboard/api_client.py could not reach the service, could
      not complete inside config.API_REQUEST_TIMEOUT_SECONDS, or came back as a server-side error. It is caught in the
      main block and handed here.
PURPOSE
Tell the person that the service is not answering, and tell them how to start it.
REQUIREMENTS
    ● The panel states plainly that the AssetGuard AI service is not answering and names the address that was tried, taken from
      config.API_BASE_URL.
    ● It gives the command that starts the service, which runs run_api_service.py from the Project folder in a second terminal,
      presented so that it can be copied and used without being retyped.
    ● The person sees this guidance and not a failure trace, with the underlying error text appearing only as a small supporting
      note beneath for someone who wants it.
    ● The panel is self-contained, so a person who has never seen the project can recover from it without reading the source.
RETURNS
Nothing; it draws a panel in place of the page that could not be loaded.

FUNCTION SIGNATURE
render_fleet_page()
PARAMETERS
None.
PURPOSE
Load the scored fleet from the service and draw the Fleet overview page.
REQUIREMENTS
    ● The whole fleet comes from fetch_fleet_risk_table called with the literal ALL, and the result reaches
      render_fleet_overview_page untouched.
    ● No counting, filtering, sorting or scoring happens here; counting, filtering and sorting belong to the page module and
      scoring belongs to the service.
RETURNS
Nothing; it draws the page.

FUNCTION SIGNATURE
render_machine_page()
PARAMETERS
None.
PURPOSE
Let the person choose a high risk machine, draw everything known about it, and offer to start an advisory run against it.
REQUIREMENTS
    ● The machines on offer come from fetch_fleet_risk_table called with config.RISK_BAND_HIGH, never typed in by hand and
      never produced by filtering a locally held fleet, in the order the service supplied so the entry at the top is the machine the
      model is most worried about; an empty high band leaves the page saying there is nothing to inspect and nothing further.
    ● The chooser sits in the sidebar beneath a divider with help text saying it is the high band of the scored fleet with the worst
      at the top, the chosen tag reaches fetch_machine_detail, an empty result produces a warning naming the tag as not found
      in the current fleet and stops the page, and the machine itself is drawn by render_machine_detail_page.
    ● A bordered action panel beneath offers to raise a repair job and states what that involves — five agents investigating in
      turn, the run pausing for a decision in the Review queue, at a cost of five language model calls — gathering a free-text
      request pre-filled with a sensible standing instruction and an access difficulty restricted to
      config.ACCESS_LEVEL_OPTIONS with the middle option pre-selected and help text explaining that policy Safety Rule 03
      makes tight space work take longer, alongside the control that starts the run.
    ● Nothing reaches request_advisory_run until the person presses that control, which leaves the page as it is where
      unpressed, shows that work is in progress and that five language model calls are being made while it runs, carries
      machine_code, request_text and access_level under exactly those names, and yields a confirmation naming the


        repair_job_id the service returned and directing the person to the Review queue page, since the draft is not issued and
        nothing further happens until it is decided there.
RETURNS
Nothing; it draws the page.

FUNCTION SIGNATURE
render_review_page()
PARAMETERS
None.
PURPOSE
Draw the review queue and connect its submit control to the service.
REQUIREMENTS
    ● The waiting drafts come from fetch_repair_jobs called with config.REPAIR_JOB_STATUS_PENDING.
    ● Both that list and submit_supervisor_decision reach render_review_queue_page, so the decision the person records
      travels to the service and the paused run is released, and nothing is issued without that decision.
    ● No decision is recorded anywhere else in the dashboard, and no state about a decision is kept locally.
RETURNS
Nothing; it draws the page.

FUNCTION SIGNATURE
render_audit_page()
PARAMETERS
None.
PURPOSE
Draw the register of reviewed repair jobs, together with the full record of whichever one the person opens.
REQUIREMENTS
    ● The two registers come separately from fetch_repair_jobs called with config.REPAIR_JOB_STATUS_APPROVED and with
      config.REPAIR_JOB_STATUS_REJECTED, and both reach render_audit_trail_page.
    ● Where neither register holds anything the page stops at the register rather than offering a chooser over nothing, and
      otherwise the chooser offers the repair_job_id of every decided order, the approved ahead of the rejected, matching the
      register above it.
    ● The chosen order is read in full through fetch_repair_job_detail and its decisions through fetch_review_history, and both
      reach render_decision_detail, so the page makes plain whether the review changed the repair job or not.
    ● The call budget comes from fetch_call_budget using the run_id carried on the chosen repair job and not its repair_job_id,
      and is drawn by render_call_budget.
RETURNS
Nothing; it draws the page.

MAIN BLOCK
Achieves:
    ● A running dashboard, invoked from the Project folder as the application file the dashboard tool runs and not with plain
      python3, its window set up with config.DASHBOARD_TITLE as the title, a manufacturing icon and a wide layout that suits
      a register several fields across.
    ● A sidebar carrying config.DASHBOARD_TITLE and config.DASHBOARD_SUBTITLE above a divider, with the page chooser
      below it offering exactly PAGE_FLEET, PAGE_MACHINE, PAGE_REVIEW and PAGE_AUDIT with one supporting line each
      from PAGE_DESCRIPTIONS and no heading of its own, since the four descriptions speak for themselves.
    ● Whichever page is chosen drawn by exactly one of render_fleet_page, render_machine_page, render_review_page or
      render_audit_page.
    ● Every one of those calls guarded, so that a refused connection to the service, an exhausted timeout or a server-side error
      results in render_service_warning being drawn with the command that starts the service, rather than a failure trace
      appearing on the page.
Creates on disk:
    ● Nothing.
    ● The listening port, the bound address and the entire appearance of the dashboard come from .streamlit/config.toml,
      which the dashboard tool reads by itself because the file was invoked from the Project folder.
    ● That settings file is also what stops the dashboard tool asking a start-up question that would otherwise sit waiting for an
      answer and make the program look frozen.
Reports to the person who ran it:
    ● The local web address at which the dashboard can be opened, printed by the dashboard tool itself on the port taken from
      the settings file.
    ● From the running page rather than from the terminal, a clear statement whenever the service on the other side is not
      answering, together with the command that starts it.

FLOW DIAGRAM:


FLOW DIAGRAM:
Role Supervisor:



Role Technician:


Role Technician:


Role Engineer:



Agent Communication Diagram:



OUTPUT
Running the six entry points in order produces the following, all inside the Project folder.

FILES CREATED




INFORMATION EACH COMMAND MUST REPORT




﻿EXPECTED OUTPUT
The transcript below is what a correct solution prints. Exact figures will differ, because the models chosen and the settings tuned
are the team's decisions. The shapes of the cleaned tables and the counts of documents and passages will not differ.

ENTRY POINT 1


Agent Communication Diagram:



OUTPUT
Running the six entry points in order produces the following, all inside the Project folder.

FILES CREATED




INFORMATION EACH COMMAND MUST REPORT




﻿EXPECTED OUTPUT
The transcript below is what a correct solution prints. Exact figures will differ, because the models chosen and the settings tuned
are the team's decisions. The shapes of the cleaned tables and the counts of documents and passages will not differ.

ENTRY POINT 1


OUTPUT
Running the six entry points in order produces the following, all inside the Project folder.

FILES CREATED




INFORMATION EACH COMMAND MUST REPORT




﻿EXPECTED OUTPUT
The transcript below is what a correct solution prints. Exact figures will differ, because the models chosen and the settings tuned
are the team's decisions. The shapes of the cleaned tables and the counts of documents and passages will not differ.

ENTRY POINT 1


Database directory ready: database
Database file: **database/assetguard.db**
Tables available: ['agent_runs', 'chat_turns', 'llm_calls',
                   'repair_jobs', 'review_decisions', 'user_accounts']
Table count: 6

Accounts you can sign in with:
   sunita    Supervisor   password: ...
   deepak    Supervisor   password: ...
   anita     Engineer     password: ...
   rehan     Engineer     password: ...
   priya     Engineer     password: ...
   manoj     Technician   password: ...
   kavya     Technician   password: ...
   vikram    Technician   password: ...


ENTRY POINT 2
Data quality report written: **output/data_quality_report.json**
Cleaned breakdown risk train: (30000, 43)
Cleaned breakdown risk eval: (8400, 43)
Cleaned downtime train: (28464, 35)
Cleaned downtime eval: (5840, 35)
Cleaned technician notes: (26891, 13)
Breakdown rate in training data: 0.1796


ENTRY POINT 3
ML model 1 of 2 - breakdown risk classifier (tabular)
    trained ... in ... seconds
    [a table comparing every candidate]
    best candidate: ...
    best settings: ...
  hold-out scores: {...}
  saved to: output/models/breakdown_model.pkl

ML model 2 of 2 - downtime estimator (tabular)
    [a table comparing every candidate]
  hold-out scores: {...}
  saved to: output/models/downtime_model.pkl

NLP model - problem type classifier (technician note text)
    vocabulary size: ...
    [a table comparing every candidate]
  training-set scores: {...}
  saved to: output/models/problem_type_model.pkl
  vectorizer saved to: output/models/text_vectorizer.pkl

Metrics written: **output/model_metrics.json**


ENTRY POINT 4
Building the maintenance knowledge index
    documents read: 16
    chunks created: ...
    chunks stored: ...
    store location: database/chroma_store

Question: water pump bearing replacement torque setting
    Manual-Water-Pump.pdf distance ...
Question: who approves a twelve hour shutdown of a critical machine
    Safety-Rule-02-Shutdown-Approval.pdf distance ...
Question: why do couplings keep failing after alignment
    Past-Problems-Casebook.pdf distance ...
The third question is the one that matters. It never uses the words the casebook uses, and the casebook must still rank first.

ENTRY POINT 5
Starting AssetGuard AI API
Docs available at http://localhost:8081/docs
INFO:     Uvicorn running on http://0.0.0.0:8081


ENTRY POINT 6
  You can now view your Streamlit app in your browser.

  Local URL: http://localhost:8080


DASHBOARD OUTPUT:










IMPLEMENTATION STEPS
Every command is run from the Project folder.

STEP 0. INSTALL AND CONFIGURE
cd Project
pip install -r requirements.txt

STEP 1. CREATE THE DATABASE
python3 run_database_setup.py

STEP 2. CLEAN THE RAW DATA
python3 run_data_preparation.py

STEP 3. TRAIN THE MODELS
python3 run_model_training.py

STEP 4. BUILD THE KNOWLEDGE BASE
python3 run_knowledge_indexing.py

STEP 5. START THE REST SERVICE
Leave this running and use a second terminal for anything else.
python3 run_api_service.py

From another terminal, confirm it answers:
curl -s localhost:8081/assets/PMP-CHE-0067/risk
curl -s "localhost:8081/fleet/risk?risk_band=HIGH" | head -c 300

STEP 6. START THE DASHBOARD
In a third terminal, with the service still running:
cd Project
python3 -m streamlit run run_dashboard.py


