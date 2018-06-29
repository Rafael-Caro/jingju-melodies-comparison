# -*- coding: utf-8 -*-
"""
Created on Mon Jun 25 22:04:34 2018

@author: Rafael.Ctt
"""

# Import modules
from music21 import *
import json



# Assign global variables
lines = [270, 272, 286, 288, 298, 300] # 302 
path = '../scores/'
unit = 0.0625
with open(path + 'lines_data.csv', 'r', encoding='utf-8') as f:
    linesData = f.readlines()



# Define functions
def str2info(line):
    '''
    str --> dic
    Takes a line from the lines-data.csv field and returns a dic with each
    annotation
    '''
    post_line = line.rstrip().split(',')
    info = {}
    info['name'] = post_line[0]
    info['hd'] = post_line[1]
    info['sq'] = post_line[2]
    info['bs'] = post_line[3]
    info['ju'] = post_line[4]
    info['line'] = post_line[5]
    info['line_s'] = float(post_line[6])
    info['line_e'] = float(post_line[7])
    info['tones'] = post_line[8]
    info['s1'] = post_line[9]
    info['s1_s'] = float(post_line[10])
    info['s1_e'] = float(post_line[11])
    info['s2'] = post_line[12]
    info['s2_s'] = float(post_line[13])
    info['s2_e'] = float(post_line[14])
    info['s3'] = post_line[15]
    info['s3_s'] = float(post_line[16])
    info['s3_e'] = float(post_line[17])
    return info


    
def findVoiceParts(score):
    '''
    music21.score --> [music21.part]
    Finds the parts of the singing voice
    '''
    voiceParts = []

    for p in score.parts:
        if len(p.flat.notes) == 0: continue
        i = 0
        n = p.flat.notes[i]
        while n.quarterLength == 0:
            i += 1
            n = p.flat.notes.stream()[i]
        if n.hasLyrics():
                if p.hasElementOfClass('Instrument'):
                    p.remove(p.getInstrument())
                voiceParts.append(p)
    return voiceParts



def scoreLines(lines):
    '''
    list --> {str:[[]]}
    Takes the list of lines and returns a dictionary of paths to a score and a
    list of segments to compute
    '''
    arias = {}
    
    for line in lines:
        lineInfo = str2info(linesData[line])
        ariaName = lineInfo['name']
        start = lineInfo['line_s']
        end = lineInfo['line_e']
        if ariaName == '':
            jump = 1
            newLine = linesData[line-jump]
            while ('Part' in newLine) or (str2info(newLine)['name'] == ''):
                jump += 1
                newLine = linesData[line-jump]
            ariaName = str2info(newLine)['name']
        ariaPath = path + ariaName
        if ariaPath not in arias.keys():
            arias[ariaPath] = [[start, end]]
        else:
            arias[ariaPath].append([start,end])

    return arias



def getNotes(aria, segments):
    '''
    str, [[float, float]] --> [[[float, int]]]
    Given a path to a score and a list of start and end offsets of lines,
    returns a list of melodies, consisting on a list of time and pitch values.
    '''

    melodies = []

    ariaName = aria.split('/')[-1]
    
    s = converter.parse(aria)
    print('Parsing', ariaName)
    part = findVoiceParts(s)[0]
    notes = part.flat.notesAndRests.stream()
    for i in range(len(segments)):
        melody = {'id':[ariaName[:-4], str(i)], 'melody':[]}
        time = 0
        start = segments[i][0]
        end = segments[i][1]
        line = part.getElementsByOffset(start, end, mustBeginInSpan=False)
        # Compute the measures and upbeats ticks
        m0 = line[0].offset
        mCount = 1
        for m in line[:-1]:
            mo = int(m.offset - m0)
            measure = {'time': mo, 'value': mCount}
            if measure not in jsonFile['legend']['measures']:
                jsonFile['legend']['measures'].append(measure)
            mCount += 1
            md = m.duration.ordinal
            if md > 1:
                for i in range(1, md):
                    upbeat = mo + i
                    if upbeat not in jsonFile['legend']['upbeats']:
                        jsonFile['legend']['upbeats'].append(upbeat)
        if md > 1:
            for i in range(1, md):
                lines.append(mo + i)
            # Compute the melody
            notes = line.flat.notesAndRests.stream()
            for n in notes:
                dur = n.quarterLength
                if dur > 0:
                    if n.isNote:
                        p = n.pitch.midi
                        if p not in legend.keys():
                            legend[p] = n.nameWithOctave
                    else:
                        p = 0
                    for i in range(int(dur / unit)):
                        nota = {'time':time, 'pitch':p}
                        melody['melody'].append(nota)
                        time += unit
            melodies.append(melody)

    return melodies



# Main code
arias = scoreLines(lines)

jsonFile = {'title':'', 'melodies':[], 'legend':{'pitches':[], 'measures':[],
            'upbeats':[]}}

legend = {}

for aria in arias.keys():
    melodies = getNotes(aria, arias[aria])
    jsonFile['melodies'].extend(melodies)
    
for p in sorted(legend.keys()):
    jsonFile['legend']['pitches'].append({'midi':p, 'name':legend[p]})



with open('melodies.json', 'w') as f:
    json.dump(jsonFile, f)
            
    